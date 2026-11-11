import { findDemoProfile } from '@/lib/connections/store';

/**
 * DEMO COLLABORATIONS — stored in this browser only (localStorage).
 * Members are fictional demo profiles (accepted connections only), so
 * nothing is sent to real people. `ownerId` is the local user profile id,
 * so a deleted/recreated profile starts clean.
 */
export interface CollaborationRecord {
    id: string;
    ownerId: string;
    name: string;
    description: string;
    /** Demo-profile ids invited from the owner's accepted connections. */
    memberIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CollaborationNote {
    id: string;
    collaborationId: string;
    ownerId: string;
    body: string;
    createdAt: string;
}

export interface CollaborationsState {
    version: 1;
    collaborations: CollaborationRecord[];
    notes: CollaborationNote[];
}

export const COLLABORATIONS_STORAGE_KEY = 'bc:v1:collaborations';

export const emptyCollaborations = (): CollaborationsState => ({ version: 1, collaborations: [], notes: [] });

const isRecord = (v: unknown): v is CollaborationRecord => {
    const o = v as Record<string, unknown> | null;
    return Boolean(
        o &&
            typeof o.id === 'string' &&
            typeof o.ownerId === 'string' &&
            typeof o.name === 'string' &&
            typeof o.description === 'string' &&
            Array.isArray(o.memberIds) &&
            o.memberIds.every((m) => typeof m === 'string') &&
            typeof o.createdAt === 'string' &&
            typeof o.updatedAt === 'string',
    );
};

const isNote = (v: unknown): v is CollaborationNote => {
    const o = v as Record<string, unknown> | null;
    return Boolean(
        o &&
            typeof o.id === 'string' &&
            typeof o.collaborationId === 'string' &&
            typeof o.ownerId === 'string' &&
            typeof o.body === 'string' &&
            typeof o.createdAt === 'string',
    );
};

export const readCollaborations = (): CollaborationsState => {
    const raw = localStorage.getItem(COLLABORATIONS_STORAGE_KEY);
    if (!raw) return emptyCollaborations();
    try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        const collaborations = (Array.isArray(o.collaborations) ? o.collaborations : []).filter(isRecord);
        const collabIds = new Set(collaborations.map((c) => c.id));
        const notes = (Array.isArray(o.notes) ? o.notes : [])
            .filter(isNote)
            .filter((n) => collabIds.has(n.collaborationId));
        return { version: 1, collaborations, notes };
    } catch (error) {
        console.warn('[collaborations] Stored data could not be read', error);
        return emptyCollaborations();
    }
};

export const writeCollaborations = (state: CollaborationsState): void => {
    try {
        localStorage.setItem(COLLABORATIONS_STORAGE_KEY, JSON.stringify(state));
    } catch {
        throw new Error('Your browser blocked saving collaboration data.');
    }
};

export { findDemoProfile };
