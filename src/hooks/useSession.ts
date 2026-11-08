import { useContext } from 'react';
import { SessionContext, type SessionContextValue } from '@/lib/sessionContext';

export const useSession = (): SessionContextValue => {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
    return ctx;
};
