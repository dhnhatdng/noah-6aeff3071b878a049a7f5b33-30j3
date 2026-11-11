import { supabase } from './client';
import type { MeetingRecord } from '@/lib/meetings/store';

/**
 * Supabase meetings repository + realtime.
 *
 * The DB stores one row per proposal (proposer_id, accepter_id, start_time,
 * location, status pending / accepted / declined). Both participants can
 * read and update a row; only the proposer can insert it. Ids are Supabase
 * auth user ids — never profile client UUIDs and never demo ids. A declined
 * meeting keeps its row (status 'declined') so it stays listed.
 */

export interface MeetingRow {
    id: string;
    proposer_id: string;
    accepter_id: string;
    start_time: string;
    location: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
}

export const toMeetingRecord = (row: MeetingRow, ownerId: string): MeetingRecord | null => {
    const base = {
        id: row.id,
        ownerId,
        status: row.status,
        startTime: row.start_time,
        location: row.location,
        createdAt: row.created_at,
        updatedAt: row.created_at,
    };
    if (row.proposer_id === ownerId) {
        return { ...base, counterpartId: row.accepter_id, direction: 'sent' as const };
    }
    if (row.accepter_id === ownerId) {
        return { ...base, counterpartId: row.proposer_id, direction: 'received' as const };
    }
    return null;
};

const requireClient = () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return supabase;
};

/** All meetings involving this user, newest first. */
export const listMeetings = async (ownerId: string): Promise<MeetingRecord[]> => {
    const client = requireClient();
    const { data, error } = await client
        .from('meetings')
        .select('*')
        .or(`proposer_id.eq.${ownerId},accepter_id.eq.${ownerId}`)
        .order('start_time', { ascending: true });
    if (error) throw new Error(`Could not load meetings: ${error.message}`);
    return ((data as MeetingRow[]) ?? [])
        .map((row) => toMeetingRecord(row, ownerId))
        .filter((r): r is MeetingRecord => r !== null);
};

export const proposeMeeting = async (
    proposerId: string,
    accepterId: string,
    startTime: string,
    location: string,
): Promise<MeetingRecord> => {
    const client = requireClient();
    const { data, error } = await client
        .from('meetings')
        .insert({ proposer_id: proposerId, accepter_id: accepterId, start_time: startTime, location, status: 'pending' })
        .select()
        .single();
    if (error || !data) throw new Error(`Could not propose the meeting: ${error?.message ?? 'no row returned'}`);
    const record = toMeetingRecord(data as MeetingRow, proposerId);
    if (!record) throw new Error('Could not propose the meeting.');
    return record;
};

/** Accepts a pending proposal (status -> accepted) or declines it (status -> declined, row kept). */
export const respondMeeting = async (ownerId: string, id: string, accept: boolean): Promise<MeetingRecord> => {
    const client = requireClient();
    const { data, error } = await client
        .from('meetings')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', id)
        .select()
        .single();
    if (error || !data) throw new Error(`Could not update the meeting: ${error?.message ?? 'no row returned'}`);
    const record = toMeetingRecord(data as MeetingRow, ownerId);
    if (!record) throw new Error('Could not update the meeting.');
    return record;
};

/**
 * Realtime subscription: refires `onChange` whenever a meeting row where
 * this user is proposer or accepter changes. Returns an unsubscribe function.
 */
export const subscribeMeetings = (ownerId: string, onChange: () => void): (() => void) => {
    const client = requireClient();
    const channel = client
        .channel(`meetings-${ownerId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'meetings', filter: `proposer_id=eq.${ownerId}` },
            onChange,
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'meetings', filter: `accepter_id=eq.${ownerId}` },
            onChange,
        )
        .subscribe();
    return () => {
        void client.removeChannel(channel);
    };
};
