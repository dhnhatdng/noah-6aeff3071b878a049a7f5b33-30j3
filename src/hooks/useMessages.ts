import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MESSAGES_STORAGE_KEY,
    readMessages,
    type MessageRecord,
    type MessagesState,
} from '@/lib/messages/store';
import { useProfile } from '@/hooks/useProfile';
import { getAnonUserId, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    listMessages as listSupabaseMessages,
    sendMessage as sendSupabaseMessage,
    subscribeMessages,
} from '@/lib/supabase/messages';

/** Live mode when Supabase is configured (realtime); localStorage demo otherwise. */
const SUPABASE_MODE = isSupabaseConfigured();

export interface UseMessages {
    isLive: boolean;
    /** The id that addresses this user in messages (auth uid live, profile id demo). */
    myId: string | null;
    /** Sorted thread with one counterpart, oldest first. Empty until loadThread runs (live). */
    thread: MessageRecord[];
    messagesFor: (counterpartId: string) => MessageRecord[];
    loadThread: (counterpartId: string) => Promise<void>;
    /** Throws when the counterpart is a demo profile (they can't receive messages). */
    sendTo: (counterpartId: string, body: string) => Promise<MessageRecord>;
}

/**
 * 1:1 messaging. Live: Supabase rows + realtime refresh. Demo: messages are
 * stored locally only, and sending to a demo profile is blocked — demo users
 * are fictional and can't receive or reply, so the UI disables the composer
 * with that explanation instead of pretending a message was delivered.
 */
export const useMessages = (): UseMessages => {
    const { profile } = useProfile();
    const [localState, setLocalState] = useState<MessagesState>(() => readMessages());
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [liveThread, setLiveThread] = useState<MessageRecord[]>([]);
    const [liveCounterpart, setLiveCounterpart] = useState<string | null>(null);
    const liveCounterpartRef = useRef<string | null>(null);
    const ownerRef = useRef<string | null>(null);

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

    // Keep multiple tabs in sync (local demo mode only; Supabase uses realtime).
    useEffect(() => {
        if (SUPABASE_MODE) return;
        const onStorage = (event: StorageEvent) => {
            if (event.key !== MESSAGES_STORAGE_KEY) return;
            setLocalState(readMessages());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const myId = SUPABASE_MODE ? ownerId : (profile?.id ?? null);

    const loadThread = useCallback(
        async (counterpartId: string) => {
            liveCounterpartRef.current = counterpartId;
            setLiveCounterpart(counterpartId);
            if (!SUPABASE_MODE) return;
            const owner = ownerRef.current;
            if (!owner) return;
            try {
                setLiveThread(await listSupabaseMessages(owner, counterpartId));
            } catch (error) {
                console.warn('[messages] Could not load thread', error);
            }
        },
        [],
    );

    // Realtime: refresh the open thread when a message arrives for this user.
    useEffect(() => {
        if (!SUPABASE_MODE || !ownerId) return;
        const unsubscribe = subscribeMessages(ownerId, () => {
            const counterpart = liveCounterpartRef.current;
            const owner = ownerRef.current;
            if (!counterpart || !owner) return;
            void listSupabaseMessages(owner, counterpart).then(setLiveThread).catch((error) => {
                console.warn('[messages] Could not refresh thread', error);
            });
        });
        return unsubscribe;
    }, [ownerId]);

    const messagesFor = useCallback(
        (counterpartId: string): MessageRecord[] => {
            if (SUPABASE_MODE) {
                return counterpartId === liveCounterpart
                    ? liveThread
                    : [];
            }
            if (!myId) return [];
            return localState.messages
                .filter((m) => m.ownerId === myId && m.counterpartId === counterpartId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        },
        [liveCounterpart, liveThread, localState.messages, myId],
    );

    const thread = useMemo(
        () => (liveCounterpart ? messagesFor(liveCounterpart) : []),
        [liveCounterpart, messagesFor],
    );

    const sendTo = useCallback(
        async (counterpartId: string, body: string): Promise<MessageRecord> => {
            const trimmed = body.trim();
            if (!trimmed) throw new Error('Write a message first.');
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                const record = await sendSupabaseMessage(owner, counterpartId, trimmed);
                if (counterpartId === liveCounterpartRef.current) {
                    setLiveThread((prev) => [...prev, record]);
                }
                return record;
            }
            // Demo mode: every counterpart is a fictional demo profile.
            throw new Error(
                'Demo users can’t receive messages. Connect with a real attendee (Supabase) to start messaging.',
            );
        },
        [],
    );

    return { isLive: SUPABASE_MODE, myId, thread, messagesFor, loadThread, sendTo };
};
