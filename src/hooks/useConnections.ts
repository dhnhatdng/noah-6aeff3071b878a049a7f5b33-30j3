import { useContext } from 'react';
import { ConnectionsContext, type ConnectionsContextValue } from '@/lib/connectionsContext';

export const useConnections = (): ConnectionsContextValue => {
    const ctx = useContext(ConnectionsContext);
    if (!ctx) throw new Error('useConnections must be used inside <ConnectionsProvider>');
    return ctx;
};
