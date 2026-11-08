import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

/**
 * App access requires a real wallet connection, or an explicitly enabled guest/demo session.
 * Note: this gates UI access only. Ownership proof (signed nonce) is a separate, pending step.
 */
const RequireSession = () => {
    const { connected, connecting } = useWallet();
    const { isGuest } = useSession();
    const location = useLocation();

    if (connected || isGuest) return <Outlet />;

    if (connecting) {
        return (
            <div className="grid min-h-screen place-items-center">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reconnecting wallet…
                </p>
            </div>
        );
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
};

export default RequireSession;
