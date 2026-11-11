import { supabase } from './client';
import type { CollaborationNote, CollaborationRecord } from '@/lib/collaborations/store';

/**
 * Supabase collaborations repository + realtime.
 *
 * The DB stores one row per collaboration (owner_id, name, description),
 * one row per member in collaboration_members (collaboration_id, user_id)
 * and one row per shared note in collaboration_notes (author_id, body).
 * Ids are Supabase auth user ids — never profile client UUIDs and never
 * demo ids. The owner is the only writer of a collaboration; members can
 * read it and add notes. Invitations are not a separate object: inviting
 * someone means adding them to collaboration_members when the
 * collaboration is created (or later via inviteMembers) — they then see
 * the collaboration in their own Hub.
 */

export interface CollaborationRow {
    id: string;
    owner_id: string;
    name: string;
    description: string;
    created_at: string;
}

export interface CollaborationMemberRow {
    collaboration_id: string;
    user_id: string;
}

export interface CollaborationNoteRow {
    id: string;
    collaboration_id: string;
    author_id: string;
    body: string;
    created_at: string;
}

export const toCollaborationRecord = (row: CollaborationRow, memberIds: string[]): CollaborationRecord => ({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description ?? '',
    memberIds,
    createdAt: row.created_at,
    // The collaborations table has no updated_at column.
    updatedAt: row.created_at,
});

export const toCollaborationNote = (row: CollaborationNoteRow): CollaborationNote => ({
    id: row.id,
    collaborationId: row.collaboration_id,
    ownerId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
});

const requireClient = () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    return supabase;
};

/** All collaborations this user owns or is a member of, newest first, with their notes. */
export const listCollaborations = async (
    ownerId: string,
): Promise<{ collaborations: CollaborationRecord[]; notes: CollaborationNote[] }> => {
    const client = requireClient();
    const { data, error } = await client
        .from('collaborations')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load collaborations: ${error.message}`);
    const rows = (data as CollaborationRow[]) ?? [];
    if (rows.length === 0) return { collaborations: [], notes: [] };

    const ids = rows.map((r) => r.id);
    const [membersRes, notesRes] = await Promise.all([
        client.from('collaboration_members').select('*').in('collaboration_id', ids),
        client.from('collaboration_notes').select('*').in('collaboration_id', ids).order('created_at', { ascending: true }),
    ]);
    if (membersRes.error) throw new Error(`Could not load collaboration members: ${membersRes.error.message}`);
    if (notesRes.error) throw new Error(`Could not load collaboration notes: ${notesRes.error.message}`);

    const membersByCollab = new Map<string, string[]>();
    for (const m of (membersRes.data as CollaborationMemberRow[]) ?? []) {
        const list = membersByCollab.get(m.collaboration_id) ?? [];
        list.push(m.user_id);
        membersByCollab.set(m.collaboration_id, list);
    }
    return {
        collaborations: rows.map((row) => toCollaborationRecord(row, membersByCollab.get(row.id) ?? [])),
        notes: ((notesRes.data as CollaborationNoteRow[]) ?? []).map(toCollaborationNote),
    };
};

/** Adds members to a collaboration (the "invite"). Invited users must be real auth user ids. */
export const inviteMembers = async (collaborationId: string, userIds: string[]): Promise<void> => {
    const client = requireClient();
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;
    const { error } = await client
        .from('collaboration_members')
        .insert(unique.map((user_id) => ({ collaboration_id: collaborationId, user_id })));
    if (error) {
        if (error.code === '23505') return; // already a member — not an error for the caller
        throw new Error(`Could not invite members: ${error.message}`);
    }
};

export const createCollaboration = async (
    ownerId: string,
    input: { name: string; description: string; memberIds: string[] },
): Promise<CollaborationRecord> => {
    const client = requireClient();
    const trimmed = input.name.trim();
    if (!trimmed) throw new Error('Give the collaboration a name.');
    const { data, error } = await client
        .from('collaborations')
        .insert({ owner_id: ownerId, name: trimmed, description: input.description.trim() })
        .select()
        .single();
    if (error || !data) throw new Error(`Could not create the collaboration: ${error?.message ?? 'no row returned'}`);
    const row = data as CollaborationRow;
    try {
        await inviteMembers(row.id, input.memberIds);
    } catch (err) {
        // The collaboration exists; a failed invite must not pretend otherwise.
        console.warn('[collaborations] Collaboration created but invites failed', err);
        throw new Error(
            `“${trimmed}” was created, but inviting members failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
    }
    return toCollaborationRecord(row, [...new Set(input.memberIds.filter(Boolean))]);
};

/** Deletes a collaboration (owner only). Members and notes cascade in the DB. */
export const deleteCollaboration = async (id: string): Promise<void> => {
    const client = requireClient();
    const { error } = await client.from('collaborations').delete().eq('id', id);
    if (error) throw new Error(`Could not delete the collaboration: ${error.message}`);
};

export const addNote = async (
    authorId: string,
    collaborationId: string,
    body: string,
): Promise<CollaborationNote> => {
    const client = requireClient();
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Write something before adding a note.');
    const { data, error } = await client
        .from('collaboration_notes')
        .insert({ collaboration_id: collaborationId, author_id: authorId, body: trimmed })
        .select()
        .single();
    if (error || !data) throw new Error(`Could not add the note: ${error?.message ?? 'no row returned'}`);
    return toCollaborationNote(data as CollaborationNoteRow);
};

/**
 * Realtime subscription: refires `onChange` whenever a collaboration, a
 * membership or a note changes. No row filters are applied — RLS limits
 * delivery to rows this user can read (collaborations they own or are a
 * member of, and their notes). Returns an unsubscribe function.
 */
export const subscribeCollaborations = (onChange: () => void): (() => void) => {
    const client = requireClient();
    const channel = client
        .channel('collaborations-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborations' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaboration_members' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaboration_notes' }, onChange)
        .subscribe();
    return () => {
        void client.removeChannel(channel);
    };
};
