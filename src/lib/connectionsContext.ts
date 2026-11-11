import { createContext } from 'react';
import type { ConnectionDirection, ConnectionRecord } from '@/lib/connections/store';
import type { UserProfile } from '@/lib/profile/types';

export type Relation =
    | { state: 'none' }
    | { state: 'pending'; direction: ConnectionDirection; record: ConnectionRecord }
    | { state: 'accepted'; record: ConnectionRecord };

export interface ConnectionsContextValue {
    /** Records belonging to the current user profile only. */
    records: ConnectionRecord[];
    /** True when connections live in Supabase (realtime) instead of localStorage. */
    isLive: boolean;
    /**
     * Real Supabase profiles (excluding self) when configured — the candidate
     * pool for matchmaking and the source for resolving connection
     * counterparts. Empty in demo mode, where DEMO_PROFILES are used instead.
     * Matchmaking / Connections pages should read this instead of assuming
     * demo data once Supabase is configured.
     */
    publicProfiles: UserProfile[];
    /**
     * Live mode only: the Supabase auth user id that owns a public profile
     * (profile ids are client UUIDs; connection/message/meeting rows address
     * people by auth user id). Undefined in demo mode or for unknown ids.
     */
    profileOwnerId: (profileId: string) => string | undefined;
    /**
     * Live mode only: the public profile owned by a Supabase auth user id —
     * the reverse lookup, for resolving a connection/message/meeting
     * counterpart (whose id is an auth user id) back to a displayable profile.
     * Undefined in demo mode or for unknown ids.
     */
    profileForOwnerId: (ownerId: string) => UserProfile | undefined;
    relationTo: (counterpartId: string) => Relation;
    /** All actions throw an Error with a user-facing message on failure. */
    sendRequest: (counterpartId: string) => Promise<void>;
    acceptRequest: (recordId: string) => Promise<void>;
    declineRequest: (recordId: string) => Promise<void>;
}

export const ConnectionsContext = createContext<ConnectionsContextValue | null>(null);
