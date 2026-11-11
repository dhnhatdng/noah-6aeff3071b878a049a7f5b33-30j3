import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';

/**
 * Full sign-out: ends the Supabase session (Google included), disconnects
 * the wallet and leaves guest mode, then reloads on /login. Works for
 * Google-only users with no wallet connected, unlike Disconnect (which
 * only drops the wallet connection). The label collapses to an icon on
 * very small screens.
 */
const SignOutButton = ({ className }: { className?: string }) => {
    const { signOut } = useSession();
    const [busy, setBusy] = useState(false);

    return (
        <button
            type="button"
            disabled={busy}
            onClick={async () => {
                if (busy) return;
                setBusy(true);
                await signOut();
            }}
            className={cn(
                'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60',
                className,
            )}
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span className="hidden sm:inline">{busy ? 'Signing out…' : 'Sign out'}</span>
        </button>
    );
};

export default SignOutButton;
