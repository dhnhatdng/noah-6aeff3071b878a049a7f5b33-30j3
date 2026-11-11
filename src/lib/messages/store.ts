/**
 * MESSAGES — localStorage fallback, used when Supabase is not configured.
 * Mirrors the versioned pattern in src/lib/connections/store.ts.
 *
 * `ownerId` is the local user profile id in demo mode, or the anonymous
 * Supabase auth user id in live mode. `counterpartId` is the other party's
 * id in the same id space (profile id in demo mode, auth user id live).
 * Messages are only ever stored for real counterparts: demo profiles can
 * neither receive nor reply, so the UI disables sending to them and this
 * store stays empty in demo mode.
 */

export interface MessageRecord {
    id: string;
    ownerId: string;
    counterpartId: string;
    /** Id of the sender in the same id space as ownerId/counterpartId. */
    senderId: string;
    body: string;
    createdAt: string;
}

export interface MessagesState {
    version: 1;
    messages: MessageRecord[];
}

export const MESSAGES_STORAGE_KEY = 'bc:v1:messages';

export const emptyMessages = (): MessagesState => ({ version: 1, messages: [] });

const isMessage = (v: unknown): v is MessageRecord => {
    const o = v as Record<string, unknown> | null;
    return Boolean(
        o &&
            typeof o.id === 'string' &&
            typeof o.ownerId === 'string' &&
            typeof o.counterpartId === 'string' &&
            typeof o.senderId === 'string' &&
            typeof o.body === 'string' &&
            typeof o.createdAt === 'string',
    );
};

export const readMessages = (): MessagesState => {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return emptyMessages();
    try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        const messages = (Array.isArray(o.messages) ? o.messages : []).filter(isMessage);
        return { version: 1, messages };
    } catch (error) {
        console.warn('[messages] Stored data could not be read', error);
        return emptyMessages();
    }
};

export const writeMessages = (state: MessagesState): void => {
    try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(state));
    } catch {
        throw new Error('Your browser blocked saving message data.');
    }
};
