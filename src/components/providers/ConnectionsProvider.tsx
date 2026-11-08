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

const SIMULATED_INCOMING = 2;

const ConnectionsProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useProfile();
    const [state, setState] = useState<ConnectionsState>(() => readConnections());
    const stateRef = useRef(state);

    const commit = useCallback((next: ConnectionsState) => {
        writeConnections(next);
        stateRef.current = next;
        setState(next);
    }, []);

    // Keep multiple tabs in sync.
    useEffect(() => {
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
     * Demo users can't act on their own, so once the profile is match-ready we create
     * two simulated incoming requests (ranks 6–7, outside the top 5) exactly once per profile.
     * They are flagged `simulated` and labelled in the UI.
     */
    useEffect(() => {
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
        () => (profile ? state.records.filter((r) => r.ownerId === profile.id) : []),
        [state.records, profile],
    );

    const relationTo = useCallback(
        (counterpartId: string): Relation => {
            const record = records.find((r) => r.counterpartId === counterpartId);
            if (!record) return { state: 'none' };
            return record.status === 'accepted'
                ? { state: 'accepted', record }
                : { state: 'pending', direction: record.direction, record };
        },
        [records],
    );

    const sendRequest = useCallback(
        (counterpartId: string) => {
            if (!profile) throw new Error('Create your profile before sending requests.');
            if (counterpartId === profile.id) throw new Error('You can’t connect with yourself.');
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
        [profile, commit],
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

    const acceptRequest = useCallback(
        (recordId: string) => {
            findIncoming(recordId);
            const current = stateRef.current;
            const now = new Date().toISOString();
            commit({
                ...current,
                records: current.records.map((r) => (r.id === recordId ? { ...r, status: 'accepted', updatedAt: now } : r)),
            });
        },
        [findIncoming, commit],
    );

    const declineRequest = useCallback(
        (recordId: string) => {
            findIncoming(recordId);
            const current = stateRef.current;
            commit({ ...current, records: current.records.filter((r) => r.id !== recordId) });
        },
        [findIncoming, commit],
    );

    const value = useMemo<ConnectionsContextValue>(
        () => ({ records, relationTo, sendRequest, acceptRequest, declineRequest }),
        [records, relationTo, sendRequest, acceptRequest, declineRequest],
    );

    return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
};

export default ConnectionsProvider;
