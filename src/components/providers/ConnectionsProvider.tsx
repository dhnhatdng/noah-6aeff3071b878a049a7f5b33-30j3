import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ConnectionsContext, type ConnectionsContextValue, type Relation } from '@/lib/connectionsContext';
import {
    CONNECTIONS_STORAGE_KEY,
    findDemoProfile,
    readConnections,
    writeConnections,
    type ConnectionRecord,
    type ConnectionsState,
} from '@/lib/connections/store';
import { DEMO_PROFILES } from '@/lib/profile/demoProfiles';
import { generateId } from '@/lib/profile/ids';
import { matchReadiness, rankMatches } from '@/lib/matchmaking/scoring';
import { useProfile } from '@/hooks/useProfile';
import { getAnonUserId, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    listConnections as listSupabaseConnections,
    respondRequest as respondSupabaseRequest,
    sendRequest as sendSupabaseRequest,
    subscribeConnections,
} from '@/lib/supabase/connections';
import { listPublicProfilesWithOwners } from '@/lib/supabase/profiles';
import type { UserProfile } from '@/lib/profile/types';

const SIMULATED_INCOMING = 2;

/** Chosen once at load: Supabase (live, realtime) when configured, localStorage demo otherwise. */
const SUPABASE_MODE = isSupabaseConfigured();

const ConnectionsProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useProfile();
    const [state, setState] = useState<ConnectionsState>(() => readConnections());
    const stateRef = useRef(state);

    // ── Supabase mode state ──────────────────────────────────────────────
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [ownerResolved, setOwnerResolved] = useState(false);
    const [liveRecords, setLiveRecords] = useState<ConnectionRecord[]>([]);
    const [publicProfiles, setPublicProfiles] = useState<UserProfile[]>([]);
    /** Real profile id -> Supabase auth user id (needed to address requests). */
    const profileOwnersRef = useRef(new Map<string, string>());

    const commit = useCallback((next: ConnectionsState) => {
        writeConnections(next);
        stateRef.current = next;
        setState(next);
    }, []);

    // Resolve the anonymous Supabase identity (no-op in demo mode).
    useEffect(() => {
        if (!SUPABASE_MODE) return;
        let active = true;
        getAnonUserId()
            .then((id) => {
                if (!active) return;
                setOwnerId(id);
                setOwnerResolved(true);
            })
            .catch(() => active && setOwnerResolved(true));
        return () => {
            active = false;
        };
    }, []);

    // Load live connections + real profiles, and subscribe to realtime changes.
    useEffect(() => {
        if (!SUPABASE_MODE || !ownerId) return;
        let active = true;
        const refreshProfiles = async () => {
            try {
                const entries = await listPublicProfilesWithOwners(ownerId);
                if (!active) return;
                profileOwnersRef.current = new Map(entries.map((e) => [e.profile.id, e.ownerId]));
                setPublicProfiles(entries.map((e) => e.profile));
            } catch (error) {
                console.warn('[connections] Could not load profiles', error);
            }
        };
        const refreshRecords = async () => {
            try {
                const rows = await listSupabaseConnections(ownerId);
                if (active) setLiveRecords(rows);
            } catch (error) {
                console.warn('[connections] Could not load connections', error);
            }
        };
        void refreshProfiles();
        void refreshRecords();
        const unsubscribe = subscribeConnections(ownerId, () => {
            void refreshRecords();
            void refreshProfiles();
        });
        return () => {
            active = false;
            unsubscribe();
        };
    }, [ownerId]);

    // Keep multiple tabs in sync (local demo mode only; Supabase uses realtime).
    useEffect(() => {
        if (SUPABASE_MODE) return;
        const onStorage = (event: StorageEvent) => {
            if (event.key !== CONNECTIONS_STORAGE_KEY) return;
            const next = readConnections();
            stateRef.current = next;
            setState(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    /**
     * DEMO MODE ONLY: demo users can't act on their own, so once the profile
     * is match-ready we create two simulated incoming requests (ranks 6–7,
     * outside the top 5) exactly once per profile. They are flagged
     * `simulated` and labelled in the UI. Never runs when Supabase is
     * configured — real requests come from real people.
     */
    useEffect(() => {
        if (SUPABASE_MODE) return;
        if (!profile || matchReadiness(profile).length > 0) return;
        const current = stateRef.current;
        if (current.seededOwners.includes(profile.id)) return;
        const taken = new Set(current.records.filter((r) => r.ownerId === profile.id).map((r) => r.counterpartId));
        const now = new Date().toISOString();
        const incoming: ConnectionRecord[] = rankMatches(profile, DEMO_PROFILES, DEMO_PROFILES.length)
            .results.slice(5)
            .filter((m) => !taken.has(m.profile.id))
            .slice(0, SIMULATED_INCOMING)
            .map((m) => ({
                id: generateId(),
                ownerId: profile.id,
                counterpartId: m.profile.id,
                direction: 'received',
                status: 'pending',
                createdAt: now,
                updatedAt: now,
                simulated: true,
            }));
        try {
            commit({ ...current, seededOwners: [...current.seededOwners, profile.id], records: [...current.records, ...incoming] });
        } catch (error) {
            console.warn('[connections] Could not save simulated requests', error);
        }
    }, [profile, commit]);

    const records = useMemo(
        () => (SUPABASE_MODE ? liveRecords : profile ? state.records.filter((r) => r.ownerId === profile.id) : []),
        [state.records, profile, liveRecords],
    );

    const relationTo = useCallback(
        (counterpartId: string): Relation => {
            // Live mode: callers pass a profile id (client UUID) but records
            // address counterparts by Supabase auth user id — translate first.
            const addressingId = SUPABASE_MODE
                ? (profileOwnersRef.current.get(counterpartId) ?? counterpartId)
                : counterpartId;
            const record = records.find((r) => r.counterpartId === addressingId);
            if (!record) return { state: 'none' };
            return record.status === 'accepted'
                ? { state: 'accepted', record }
                : { state: 'pending', direction: record.direction, record };
        },
        [records],
    );

    const profileOwnerId = useCallback(
        (profileId: string): string | undefined => profileOwnersRef.current.get(profileId),
        [],
    );

    const profileForOwnerId = useCallback(
        (ownerId: string): UserProfile | undefined => {
            for (const [profileId, owner] of profileOwnersRef.current) {
                if (owner === ownerId) return publicProfiles.find((p) => p.id === profileId);
            }
            return undefined;
        },
        [publicProfiles],
    );

    const requireSupabaseOwner = useCallback((): string => {
        if (!ownerId) {
            throw new Error(
                ownerResolved
                    ? 'Supabase anonymous sign-in is not available. Enable anonymous sign-ins in the Supabase dashboard.'
                    : 'Supabase is still connecting. Try again in a moment.',
            );
        }
        return ownerId;
    }, [ownerId, ownerResolved]);

    const sendRequest = useCallback(
        async (counterpartId: string) => {
            if (!profile) throw new Error('Create your profile before sending requests.');
            if (counterpartId === profile.id) throw new Error('You can’t connect with yourself.');
            if (SUPABASE_MODE) {
                const owner = requireSupabaseOwner();
                const counterpartOwnerId = profileOwnersRef.current.get(counterpartId);
                if (!counterpartOwnerId) throw new Error('This profile is no longer available.');
                if (records.some((r) => r.counterpartId === counterpartId)) {
                    throw new Error('You already have a request or connection with this person.');
                }
                await sendSupabaseRequest(owner, counterpartOwnerId);
                setLiveRecords(await listSupabaseConnections(owner));
                return;
            }
            if (!findDemoProfile(counterpartId)) throw new Error('This profile no longer exists.');
            const current = stateRef.current;
            if (current.records.some((r) => r.ownerId === profile.id && r.counterpartId === counterpartId)) {
                throw new Error('You already have a request or connection with this person.');
            }
            const now = new Date().toISOString();
            commit({
                ...current,
                records: [
                    ...current.records,
                    {
                        id: generateId(),
                        ownerId: profile.id,
                        counterpartId,
                        direction: 'sent',
                        status: 'pending',
                        createdAt: now,
                        updatedAt: now,
                        simulated: false,
                    },
                ],
            });
        },
        [profile, commit, records, requireSupabaseOwner],
    );

    const findIncoming = useCallback(
        (recordId: string) => {
            const record = stateRef.current.records.find((r) => r.id === recordId);
            if (!record || record.ownerId !== profile?.id || record.direction !== 'received' || record.status !== 'pending') {
                throw new Error('This request is no longer pending.');
            }
            return record;
        },
        [profile],
    );

    const findLiveIncoming = useCallback(
        (recordId: string) => {
            const record = records.find((r) => r.id === recordId);
            if (!record || record.direction !== 'received' || record.status !== 'pending') {
                throw new Error('This request is no longer pending.');
            }
            return record;
        },
        [records],
    );

    const acceptRequest = useCallback(
        async (recordId: string) => {
            if (SUPABASE_MODE) {
                const owner = requireSupabaseOwner();
                findLiveIncoming(recordId);
                await respondSupabaseRequest(owner, recordId, true);
                setLiveRecords(await listSupabaseConnections(owner));
                return;
            }
            findIncoming(recordId);
            const current = stateRef.current;
            const now = new Date().toISOString();
            commit({
                ...current,
                records: current.records.map((r) => (r.id === recordId ? { ...r, status: 'accepted', updatedAt: now } : r)),
            });
        },
        [findIncoming, findLiveIncoming, commit, requireSupabaseOwner],
    );

    const declineRequest = useCallback(
        async (recordId: string) => {
            if (SUPABASE_MODE) {
                const owner = requireSupabaseOwner();
                findLiveIncoming(recordId);
                await respondSupabaseRequest(owner, recordId, false);
                setLiveRecords(await listSupabaseConnections(owner));
                return;
            }
            findIncoming(recordId);
            const current = stateRef.current;
            commit({ ...current, records: current.records.filter((r) => r.id !== recordId) });
        },
        [findIncoming, findLiveIncoming, commit, requireSupabaseOwner],
    );

    const value = useMemo<ConnectionsContextValue>(
        () => ({
            records,
            isLive: SUPABASE_MODE,
            publicProfiles: SUPABASE_MODE ? publicProfiles : [],
            profileOwnerId,
            profileForOwnerId,
            relationTo,
            sendRequest,
            acceptRequest,
            declineRequest,
        }),
        [records, publicProfiles, profileOwnerId, profileForOwnerId, relationTo, sendRequest, acceptRequest, declineRequest],
    );

    return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
};

export default ConnectionsProvider;
