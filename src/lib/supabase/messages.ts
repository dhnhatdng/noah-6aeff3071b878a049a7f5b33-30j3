import { supabase } from './client';
import type { MessageRecord } from '@/lib/messages/store';

/**
 * Supabase messages repository + realtime.
 *
 * The DB stores one row per message (sender_id, receiver_id, body). Both
 * participants can read a row; only the sender can insert it. Ids are
 * Supabase auth user ids — never profile client UUIDs and never demo ids.
 */

export interface MessageRow {
    id: string;
    sender_id: string;
    receiver_id: string;
    body: string;
    created_at: string;
}

export const toMessageRecord = (row: MessageRow, ownerId: string): MessageRecord => ({
    id: row.id,
    ownerId,
    counterpartId: row.sender_id === ownerId ? row.receiver_id : row.sender_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
});

const requireClient = () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return supabase;
};

/** The 1:1 thread between two users, oldest first. */
export const listMessages = async (userA: string, userB: string): Promise<MessageRecord[]> => {
    const client = requireClient();
    const { data, error } = await client
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`)
        .order('created_at', { ascending: true });
    if (error) throw new Error(`Could not load messages: ${error.message}`);
    return ((data as MessageRow[]) ?? []).map((row) => toMessageRecord(row, userA));
};

export const sendMessage = async (senderId: string, receiverId: string, body: string): Promise<MessageRecord> => {
    const client = requireClient();
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Write a message first.');
    const { data, error } = await client
        .from('messages')
        .insert({ sender_id: senderId, receiver_id: receiverId, body: trimmed })
        .select()
        .single();
    if (error || !data) throw new Error(`Could not send the message: ${error?.message ?? 'no row returned'}`);
    return toMessageRecord(data as MessageRow, senderId);
};

/**
 * Realtime subscription: refires `onMessage` whenever a message is sent to
 * or from this user. Returns an unsubscribe function.
 */
export const subscribeMessages = (userId: string, onMessage: () => void): (() => void) => {
    const client = requireClient();
    const channel = client
        .channel(`messages-${userId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
            onMessage,
        )
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
            onMessage,
        )
        .subscribe();
    return () => {
        void client.removeChannel(channel);
    };
};
