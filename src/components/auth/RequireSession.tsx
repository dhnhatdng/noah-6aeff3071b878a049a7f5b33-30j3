import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

/**
 * App access requires a real wallet connection, an explicitly enabled
 * guest/demo session, or a real (non-anonymous) Supabase Auth session
 * (e.g. Google OAuth). Anonymous Supabase sessions do not open the gate.
 * Note: this gates UI access only. Ownership proof (signed nonce) is a separate, pending step.
 */
const RequireSession = () => {
    const { connected, connecting } = useWallet();
    const { isGuest, supabaseUserId } = useSession();
    const location = useLocation();

    if (connected || isGuest || supabaseUserId) return <Outlet />;

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
