import { createContext } from 'react';
import type { ConnectionDirection, ConnectionRecord } from '@/lib/connections/store';

export type Relation =
    | { state: 'none' }
    | { state: 'pending'; direction: ConnectionDirection; record: ConnectionRecord }
    | { state: 'accepted'; record: ConnectionRecord };

export interface ConnectionsContextValue {
    /** Records belonging to the current user profile only. */
    records: ConnectionRecord[];
    relationTo: (counterpartId: string) => Relation;
    /** All actions throw an Error with a user-facing message on failure. */
    sendRequest: (counterpartId: string) => void;
    acceptRequest: (recordId: string) => void;
    declineRequest: (recordId: string) => void;
}

export const ConnectionsContext = createContext<ConnectionsContextValue | null>(null);
