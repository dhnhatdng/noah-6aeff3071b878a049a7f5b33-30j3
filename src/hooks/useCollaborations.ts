import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    COLLABORATIONS_STORAGE_KEY,
    emptyCollaborations,
    readCollaborations,
    writeCollaborations,
    type CollaborationNote,
    type CollaborationRecord,
    type CollaborationsState,
} from '@/lib/collaborations/store';
import { useProfile } from '@/hooks/useProfile';
import { generateId } from '@/lib/profile/ids';
import { getAnonUserId, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    addNote as addSupabaseNote,
    createCollaboration as createSupabaseCollaboration,
    deleteCollaboration as deleteSupabaseCollaboration,
    inviteMembers as inviteSupabaseMembers,
    listCollaborations as listSupabaseCollaborations,
    subscribeCollaborations,
} from '@/lib/supabase/collaborations';

/** Live mode when Supabase is configured (realtime); localStorage demo otherwise. */
const SUPABASE_MODE = isSupabaseConfigured();

export interface UseCollaborations {
    isLive: boolean;
    /** The id that addresses this user in collaborations (auth uid live, profile id demo). */
    myId: string | null;
    /** Collaborations belonging to the current user (live: owned or joined). */
    collaborations: CollaborationRecord[];
    notesFor: (collaborationId: string) => CollaborationNote[];
    createCollaboration: (input: { name: string; description: string; memberIds: string[] }) => Promise<CollaborationRecord>;
    deleteCollaboration: (id: string) => Promise<void>;
    addNote: (collaborationId: string, body: string) => Promise<CollaborationNote>;
    /** Adds members (invites) to an existing collaboration. */
    inviteMembers: (collaborationId: string, memberIds: string[]) => Promise<void>;
}

/**
 * Collaborations hook, following the meetings pattern: versioned
 * localStorage state in demo mode, Supabase rows + realtime refresh in
 * live mode. In live mode member ids are Supabase auth user ids; in demo
 * mode they are demo-profile ids from accepted connections.
 */
export const useCollaborations = (): UseCollaborations => {
    const { profile } = useProfile();
    const [localState, setLocalState] = useState<CollaborationsState>(() => readCollaborations());
    const localRef = useRef(localState);

    // ── Supabase mode state ──────────────────────────────────────────────
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [liveCollaborations, setLiveCollaborations] = useState<CollaborationRecord[]>([]);
    const [liveNotes, setLiveNotes] = useState<CollaborationNote[]>([]);
    const ownerRef = useRef<string | null>(null);

    const commitLocal = useCallback((next: CollaborationsState) => {
        writeCollaborations(next);
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
            const { collaborations, notes } = await listSupabaseCollaborations(owner);
            setLiveCollaborations(collaborations);
            setLiveNotes(notes);
        } catch (error) {
            console.warn('[collaborations] Could not load collaborations', error);
        }
    }, []);

    // Load live collaborations + realtime refresh.
    useEffect(() => {
        if (!SUPABASE_MODE || !ownerId) return;
        void refreshLive();
        const unsubscribe = subscribeCollaborations(() => void refreshLive());
        return unsubscribe;
    }, [ownerId, refreshLive]);

    // Keep multiple tabs in sync (local demo mode only; Supabase uses realtime).
    useEffect(() => {
        if (SUPABASE_MODE) return;
        const onStorage = (event: StorageEvent) => {
            if (event.key !== COLLABORATIONS_STORAGE_KEY) return;
            const next = readCollaborations();
            localRef.current = next;
            setLocalState(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const myId = SUPABASE_MODE ? ownerId : (profile?.id ?? null);

    const collaborations = useMemo(
        () =>
            SUPABASE_MODE
                ? liveCollaborations
                : profile
                  ? localState.collaborations.filter((c) => c.ownerId === profile.id)
                  : [],
        [liveCollaborations, localState.collaborations, profile],
    );

    const allNotes = SUPABASE_MODE ? liveNotes : localState.notes;

    const notesFor = useCallback(
        (collaborationId: string) =>
            allNotes
                .filter((n) => n.collaborationId === collaborationId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        [allNotes],
    );

    const createCollaboration = useCallback(
        async ({ name, description, memberIds }: { name: string; description: string; memberIds: string[] }) => {
            const trimmed = name.trim();
            if (!trimmed) throw new Error('Give the collaboration a name.');
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                const record = await createSupabaseCollaboration(owner, {
                    name: trimmed,
                    description,
                    memberIds,
                });
                await refreshLive();
                return record;
            }
            if (!profile) throw new Error('Create your profile before starting a collaboration.');
            const now = new Date().toISOString();
            const record: CollaborationRecord = {
                id: generateId(),
                ownerId: profile.id,
                name: trimmed,
                description: description.trim(),
                memberIds: [...new Set(memberIds)],
                createdAt: now,
                updatedAt: now,
            };
            commitLocal({ ...localRef.current, collaborations: [...localRef.current.collaborations, record] });
            return record;
        },
        [profile, commitLocal, refreshLive],
    );

    const deleteCollaboration = useCallback(
        async (id: string) => {
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                await deleteSupabaseCollaboration(id);
                await refreshLive();
                return;
            }
            if (!profile) throw new Error('Create your profile before managing collaborations.');
            const current = localRef.current;
            commitLocal({
                ...current,
                collaborations: current.collaborations.filter((c) => !(c.id === id && c.ownerId === profile.id)),
                notes: current.notes.filter((n) => n.collaborationId !== id),
            });
        },
        [profile, commitLocal, refreshLive],
    );

    const addNote = useCallback(
        async (collaborationId: string, body: string) => {
            const trimmed = body.trim();
            if (!trimmed) throw new Error('Write something before adding a note.');
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                const note = await addSupabaseNote(owner, collaborationId, trimmed);
                await refreshLive();
                return note;
            }
            if (!profile) throw new Error('Create your profile before adding notes.');
            const collab = localRef.current.collaborations.find(
                (c) => c.id === collaborationId && c.ownerId === profile.id,
            );
            if (!collab) throw new Error('This collaboration no longer exists.');
            const note: CollaborationNote = {
                id: generateId(),
                collaborationId,
                ownerId: profile.id,
                body: trimmed,
                createdAt: new Date().toISOString(),
            };
            commitLocal({ ...localRef.current, notes: [...localRef.current.notes, note] });
            return note;
        },
        [profile, commitLocal, refreshLive],
    );

    const inviteMembers = useCallback(
        async (collaborationId: string, memberIds: string[]) => {
            const unique = [...new Set(memberIds.filter(Boolean))];
            if (unique.length === 0) return;
            if (SUPABASE_MODE) {
                const owner = ownerRef.current;
                if (!owner) throw new Error('Supabase is still connecting. Try again in a moment.');
                await inviteSupabaseMembers(collaborationId, unique);
                await refreshLive();
                return;
            }
            if (!profile) throw new Error('Create your profile before managing collaborations.');
            const current = localRef.current;
            const collab = current.collaborations.find((c) => c.id === collaborationId && c.ownerId === profile.id);
            if (!collab) throw new Error('This collaboration no longer exists.');
            commitLocal({
                ...current,
                collaborations: current.collaborations.map((c) =>
                    c.id === collaborationId
                        ? { ...c, memberIds: [...new Set([...c.memberIds, ...unique])], updatedAt: new Date().toISOString() }
                        : c,
                ),
            });
        },
        [profile, commitLocal, refreshLive],
    );

    return { isLive: SUPABASE_MODE, myId, collaborations, notesFor, createCollaboration, deleteCollaboration, addNote, inviteMembers };
};

export { emptyCollaborations };
