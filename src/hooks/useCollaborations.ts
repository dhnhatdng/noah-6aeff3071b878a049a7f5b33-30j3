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

export interface UseCollaborations {
    /** Collaborations belonging to the current user profile only. */
    collaborations: CollaborationRecord[];
    notesFor: (collaborationId: string) => CollaborationNote[];
    createCollaboration: (input: { name: string; description: string; memberIds: string[] }) => CollaborationRecord;
    deleteCollaboration: (id: string) => void;
    addNote: (collaborationId: string, body: string) => CollaborationNote;
}

/**
 * Local-only collaborations hook, following the connections-store pattern:
 * versioned localStorage state, read/write helpers with try/catch, and
 * multi-tab sync via the `storage` event.
 */
export const useCollaborations = (): UseCollaborations => {
    const { profile } = useProfile();
    const [state, setState] = useState<CollaborationsState>(() => readCollaborations());
    const stateRef = useRef(state);

    const commit = useCallback((next: CollaborationsState) => {
        writeCollaborations(next);
        stateRef.current = next;
        setState(next);
    }, []);

    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== COLLABORATIONS_STORAGE_KEY) return;
            const next = readCollaborations();
            stateRef.current = next;
            setState(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const collaborations = useMemo(
        () => (profile ? state.collaborations.filter((c) => c.ownerId === profile.id) : []),
        [state.collaborations, profile],
    );

    const notesFor = useCallback(
        (collaborationId: string) =>
            state.notes
                .filter((n) => n.collaborationId === collaborationId)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        [state.notes],
    );

    const createCollaboration = useCallback(
        ({ name, description, memberIds }: { name: string; description: string; memberIds: string[] }) => {
            if (!profile) throw new Error('Create your profile before starting a collaboration.');
            const trimmed = name.trim();
            if (!trimmed) throw new Error('Give the collaboration a name.');
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
            commit({ ...stateRef.current, collaborations: [...stateRef.current.collaborations, record] });
            return record;
        },
        [profile, commit],
    );

    const deleteCollaboration = useCallback(
        (id: string) => {
            if (!profile) throw new Error('Create your profile before managing collaborations.');
            const current = stateRef.current;
            commit({
                ...current,
                collaborations: current.collaborations.filter((c) => !(c.id === id && c.ownerId === profile.id)),
                notes: current.notes.filter((n) => n.collaborationId !== id),
            });
        },
        [profile, commit],
    );

    const addNote = useCallback(
        (collaborationId: string, body: string) => {
            if (!profile) throw new Error('Create your profile before adding notes.');
            const trimmed = body.trim();
            if (!trimmed) throw new Error('Write something before adding a note.');
            const collab = stateRef.current.collaborations.find(
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
            commit({ ...stateRef.current, notes: [...stateRef.current.notes, note] });
            return note;
        },
        [profile, commit],
    );

    return { collaborations, notesFor, createCollaboration, deleteCollaboration, addNote };
};

export { emptyCollaborations };
