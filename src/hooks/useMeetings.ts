import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MEETINGS_STORAGE_KEY,
    MEETING_LOCATION_DEFAULT,
    readMeetings,
    validateMeetingStart,
    writeMeetings,
    type MeetingRecord,
    type MeetingsState,
} from '@/lib/meetings/store';
import { useProfile } from '@/hooks/useProfile';
import { generateId } from '@/lib/profile/ids';
import { getAnonUserId, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    listMeetings as listSupabaseMeetings,
    proposeMeeting as proposeSupabaseMeeting,
    respondMeeting as respondSupabaseMeeting,
    subscribeMeetings,
} from '@/lib/supabase/meetings';

/** Live mode when Supabase is configured (realtime); localStorage demo otherwise. */
const SUPABASE_MODE = isSupabaseConfigured();

export interface MeetingInput {
    /** ISO timestamp of the meeting start. */
    startTime: string;
    location?: string;
}

export interface UseMeetings {
    isLive: boolean;
    /** The id that addresses this user in meetings (auth uid live, profile id demo). */
    myId: string | null;
    /** All meetings involving this user. */
    meetings: MeetingRecord[];
    /** Accepted meetings starting now or later, soonest first. */
    upcomingAccepted: MeetingRecord[];
    proposeMeeting: (counterpartId: string, input: MeetingInput) => Promise<MeetingRecord>;
    acceptMeeting: (id: string) => Promise<void>;
    declineMeeting: (id: string) => Promise<void>;
}

/**
 * Meeting booking. Live: Supabase rows + realtime refresh. Demo: meetings
 * are stored locally only (a demo counterpart can't accept, so proposals
 * stay pending — same honest behaviour as demo connection requests).
 * Proposals are validated against the Breakpoint window, Nov 15–17, 2026.
 */
export const useMeetings = (): UseMeetings => {
    const { profile } = useProfile();
    const [localState, setLocalState] = useState<MeetingsState>(() => readMeetings());
    const localRef = useRef(localState);
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [liveMeetings, setLiveMeetings] = useState<MeetingRecord[]>([]);
    const ownerRef = useRef<string | null>(null);

    const commitLocal = useCallback((next: MeetingsState) => {
        writeMeetings(next);
        localRef.current = next;
        setLocalState(next);
    }, []);

    // Resolve the anonymous Supabase identity (no-op in demo mode).
    useEffect(() => {
        if (!SUPABASE_MODE) return;
        let active = true;
        getAnonUserId().then((id) => {
            if (!active) return;
            ownerRef.current = id;
            setOwnerId(id);
        });
        return () => {
            active = false;
        };
    }, []);

    const refreshLive = useCallback(async () => {
        const owner = ownerRef.current;
        if (!owner) return;
        try {
            setLiveMeetings(await listSupabaseMeetings(owner));
        } catch (error) {
            console.warn('[meetings] Could not load meetings', error);
        }
    }, []);

    // Load live meetings + realtime refresh.
    useEffect(() => {
        if (!SUPABASE_MODE || !ownerId) return;
        void refreshLive();
        const unsubscribe = subscribeMeetings(ownerId, () => void refreshLive());
        return unsubscribe;
    }, [ownerId, refreshLive]);

    // Keep multiple tabs in sync (local demo mode only; Supabase uses realtime).
    useEffect(() => {
        if (SUPABASE_MODE) return;
        const onStorage = (event: StorageEvent) => {
            if (event.key !== MEETINGS_STORAGE_KEY) return;
            const next = readMeetings();
            localRef.current = next;
            setLocalState(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const myId = SUPABASE_MODE ? ownerId : (profile?.id ?? null);

    const meetings = useMemo(
        () =>
            SUPABASE_MODE
                ? liveMeetings
                : myId
                  ? localState.meetings.filter((m) => m.ownerId === myId)
                  : [],
        [liveMeetings, localState.meetings, myId],
    );

    const upcomingAccepted = useMemo(() => {
        const now = new Date().toISOString();
        return meetings
            .filter((m) => m.status === 'accepted' && m.startTime >= now)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [meetings]);

    const proposeMeeting = useCallback(
        async (counterpartId: string, input: MeetingInput): Promise<MeetingRecord> => {
            const startError = validateMeetingStart(input.startTime);
            if (startError) throw new Error(startError);
            const location = input.location?.trim() || MEETING_LOCATION_DEFAULT;
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                if (counterpartId === owner) throw new Error('You can’t book a meeting with yourself.');
                const record = await proposeSupabaseMeeting(owner, counterpartId, input.startTime, location);
                await refreshLive();
                return record;
            }
            if (!profile) throw new Error('Create your profile before booking meetings.');
            if (counterpartId === profile.id) throw new Error('You can’t book a meeting with yourself.');
            const now = new Date().toISOString();
            const record: MeetingRecord = {
                id: generateId(),
                ownerId: profile.id,
                counterpartId,
                direction: 'sent',
                status: 'pending',
                startTime: input.startTime,
                location,
                createdAt: now,
                updatedAt: now,
            };
            commitLocal({ ...localRef.current, meetings: [...localRef.current.meetings, record] });
            return record;
        },
        [profile, commitLocal, refreshLive],
    );

    const respondLocal = useCallback(
        (id: string, accept: boolean) => {
            if (!profile) throw new Error('Create your profile before managing meetings.');
            const current = localRef.current;
            const meeting = current.meetings.find(
                (m) => m.id === id && m.ownerId === profile.id && m.direction === 'received' && m.status === 'pending',
            );
            if (!meeting) throw new Error('This meeting proposal is no longer pending.');
            commitLocal({
                ...current,
                meetings: current.meetings.map((m) =>
                    m.id === id ? { ...m, status: accept ? 'accepted' : 'declined', updatedAt: new Date().toISOString() } : m,
                ),
            });
        },
        [profile, commitLocal],
    );

    const acceptMeeting = useCallback(
        async (id: string) => {
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                await respondSupabaseMeeting(owner, id, true);
                await refreshLive();
                return;
            }
            respondLocal(id, true);
        },
        [respondLocal, refreshLive],
    );

    const declineMeeting = useCallback(
        async (id: string) => {
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                await respondSupabaseMeeting(owner, id, false);
                await refreshLive();
                return;
            }
            respondLocal(id, false);
        },
        [respondLocal, refreshLive],
    );

    return { isLive: SUPABASE_MODE, myId, meetings, upcomingAccepted, proposeMeeting, acceptMeeting, declineMeeting };
};
