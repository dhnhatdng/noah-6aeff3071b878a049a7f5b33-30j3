import { supabase } from './client';
import type { ConnectionRecord } from '@/lib/connections/store';

/**
 * Supabase connections repository + realtime.
 *
 * The DB stores one row per pair (requester_id, accepter_id) with a status of
 * pending / accepted / declined. The UI's ConnectionRecord is always written
 * from the viewer's side: requester = 'sent', accepter = 'received'.
 * Declining deletes the row, matching the local store (a declined request
 * disappears and can be re-sent later).
 */

export interface ConnectionRow {
    id: string;
    requester_id: string;
    accepter_id: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
    updated_at: string;
}

export const toConnectionRecord = (row: ConnectionRow, ownerId: string): ConnectionRecord | null => {
    if (row.status === 'declined') return null;
    const base = {
        id: row.id,
        ownerId,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status === 'accepted' ? ('accepted' as const) : ('pending' as const),
        simulated: false,
    };
    if (row.requester_id === ownerId) {
        return { ...base, counterpartId: row.accepter_id, direction: 'sent' as const };
    }
    if (row.accepter_id === ownerId) {
        return { ...base, counterpartId: row.requester_id, direction: 'received' as const };
    }
    return null;
};

const requireClient = () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return supabase;
};

/** All connection rows involving this user, newest first. */
export const listConnections = async (ownerId: string): Promise<ConnectionRecord[]> => {
    const client = requireClient();
    const { data, error } = await client
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${ownerId},accepter_id.eq.${ownerId}`)
        .order('updated_at', { ascending: false });
    if (error) throw new Error(`Could not load connections: ${error.message}`);
    return ((data as ConnectionRow[]) ?? [])
        .map((row) => toConnectionRecord(row, ownerId))
        .filter((r): r is ConnectionRecord => r !== null);
};

export const sendRequest = async (ownerId: string, counterpartId: string): Promise<ConnectionRecord> => {
    const client = requireClient();
    const { data, error } = await client
        .from('connections')
        .insert({ requester_id: ownerId, accepter_id: counterpartId, status: 'pending' })
        .select()
        .single();
    if (error || !data) {
        if (error?.code === '23505') throw new Error('You already have a request or connection with this person.');
        throw new Error(`Could not send the request: ${error?.message ?? 'no row returned'}`);
    }
    const record = toConnectionRecord(data as ConnectionRow, ownerId);
    if (!record) throw new Error('Could not send the request.');
    return record;
};

/**
 * Accepts a pending request (status -> accepted) or declines it (row deleted,
 * like the local store). Returns the updated record, or null when declined.
 */
export const respondRequest = async (
    ownerId: string,
    id: string,
    accept: boolean,
): Promise<ConnectionRecord | null> => {
    const client = requireClient();
    if (!accept) {
        const { error } = await client.from('connections').delete().eq('id', id);
        if (error) throw new Error(`Could not decline the request: ${error.message}`);
        return null;
    }
    const { data, error } = await client
        .from('connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error || !data) throw new Error(`Could not accept the request: ${error?.message ?? 'no row returned'}`);
    return toConnectionRecord(data as ConnectionRow, ownerId);
};

/**
 * Realtime subscription: refires `onChange` whenever a connection row where
 * this user is requester or accepter is inserted, updated or deleted.
 * Returns an unsubscribe function. RLS still applies — only the two
 * participants' rows are visible to this client.
 */
export const subscribeConnections = (ownerId: string, onChange: () => void): (() => void) => {
    const client = requireClient();
    const channel = client
        .channel(`connections-${ownerId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'connections', filter: `requester_id=eq.${ownerId}` },
            onChange,
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'connections', filter: `accepter_id=eq.${ownerId}` },
            onChange,
        )
        .subscribe();
    return () => {
        void client.removeChannel(channel);
    };
};
