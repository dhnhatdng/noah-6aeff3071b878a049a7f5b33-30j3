import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Eye, KeyRound, Network, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/layout/BrandLogo';
import NetworkBadge from '@/components/wallet/NetworkBadge';
import SecurityNote from '@/components/wallet/SecurityNote';
import StatusPill from '@/components/common/StatusPill';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/hooks/use-toast';
import { GOOGLE_AUTH_ENABLED, GUEST_MODE_ENABLED, NETWORK_LABELS, SOLANA_NETWORK } from '@/lib/config';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

const principles = [
    { icon: KeyRound, title: 'Your wallet is your identity', body: 'Sign in with your Solana wallet — no passwords.' },
    { icon: ShieldCheck, title: 'Never your keys', body: 'We will never ask for a seed phrase or private key.' },
    {
        icon: Network,
        title: `${NETWORK_LABELS[SOLANA_NETWORK]} environment`,
        body: 'Development runs on Devnet. Mainnet is supported via configuration.',
    },
];

const GoogleMark = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M21.35 11.1H12v2.98h5.35c-.23 1.45-1.67 4.25-5.35 4.25-3.22 0-5.85-2.67-5.85-5.95S8.78 6.43 12 6.43c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.7 3.87 14.56 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.25 0 8.73-3.69 8.73-8.89 0-.6-.07-1.05-.15-1.51z" />
    </svg>
);

const Login = () => {
    const { connected } = useWalletConnect();
    const { enterGuestMode, supabaseUserId } = useSession();
    const { setVisible } = useWalletModal();
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

    // Google sign-in is only offered when the OAuth provider is configured
    // (env flag) and Supabase is connected; otherwise the button stays
    // disabled with an honest "Not set up yet" label.
    const googleReady = GOOGLE_AUTH_ENABLED && isSupabaseConfigured();

    useEffect(() => {
        if (connected || supabaseUserId) navigate(from, { replace: true });
    }, [connected, supabaseUserId, from, navigate]);

    const signInWithGoogle = async () => {
        if (!googleReady || !supabase || googleLoading) return;
        setGoogleLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/login` },
        });
        if (error) {
            setGoogleLoading(false);
            toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
        }
        // On success the browser leaves for Google; the Supabase session is
        // picked up automatically on the redirect back to /login.
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
            {/* Brand panel */}
            <aside className="relative hidden overflow-hidden border-r border-border bg-primary-soft p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
                <svg
                    viewBox="0 0 600 600"
                    className="pointer-events-none absolute -bottom-40 -right-40 h-[620px] w-[620px] text-primary"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden
                >
                    {[80, 140, 200, 260].map((r) => (
                        <g key={r}>
                            <circle cx="250" cy="300" r={r} strokeWidth="1.5" opacity={0.9 - r / 400} />
                            <circle cx="370" cy="300" r={r} strokeWidth="1.5" opacity={0.9 - r / 400} />
                        </g>
                    ))}
                </svg>

                <BrandLogo className="relative" />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="relative max-w-lg"
                >
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-strong">
                        Wallet-first networking
                    </p>
                    <h1 className="text-5xl font-semibold leading-[1.04] xl:text-6xl">
                        Meet the people <em className="font-medium italic text-primary-strong">worth</em> meeting at
                        Breakpoint.
                    </h1>
                    <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted-foreground">
                        AI-assisted introductions, live event tools and a shared space to keep building after the
                        conference ends.
                    </p>
                </motion.div>

                <ul className="relative grid gap-5">
                    {principles.map((p, i) => (
                        <motion.li
                            key={p.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.08, duration: 0.45 }}
                            className="flex gap-4"
                        >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-card text-primary-strong shadow-card">
                                <p.icon className="h-[18px] w-[18px]" aria-hidden />
                            </span>
                            <span>
                                <span className="block font-medium">{p.title}</span>
                                <span className="block text-sm text-muted-foreground">{p.body}</span>
                            </span>
                        </motion.li>
                    ))}
                </ul>
            </aside>

            {/* Auth panel */}
            <main className="flex flex-col px-5 py-5 sm:px-10">
                <div className="flex items-center justify-between gap-3">
                    <BrandLogo className="lg:hidden" />
                    <NetworkBadge className="ml-auto" />
                </div>

                <div className="flex flex-1 items-center justify-center py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="w-full max-w-md"
                    >
                        <h2 className="text-3xl font-semibold leading-tight sm:text-[34px]">Sign in with your wallet</h2>
                        <p className="mt-2 text-[15px] text-muted-foreground">
                            Choose a Solana wallet and approve the connection request.
                        </p>

                        <div className="mt-8">
                            <Button
                                className="h-12 w-full rounded-2xl text-base font-semibold"
                                onClick={() => setVisible(true)}
                            >
                                <Wallet className="h-5 w-5" aria-hidden />
                                Connect Wallet
                            </Button>
                            <p className="mt-3 text-center text-sm text-muted-foreground">
                                Choose your Solana wallet in the next step — Phantom, Solflare, and other detected
                                wallets.
                            </p>
                        </div>

                        <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            <span className="h-px flex-1 bg-border" />
                            or
                            <span className="h-px flex-1 bg-border" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                disabled={!googleReady || googleLoading}
                                onClick={signInWithGoogle}
                                className="h-12 justify-between rounded-2xl border-border bg-card px-4"
                            >
                                <span className="flex items-center gap-3">
                                    <GoogleMark />
                                    {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                                </span>
                                {!googleReady && <StatusPill>Not set up yet</StatusPill>}
                            </Button>

                            {GUEST_MODE_ENABLED && (
                                <Button
                                    variant="ghost"
                                    className="h-11 rounded-2xl text-muted-foreground hover:bg-secondary"
                                    onClick={() => {
                                        enterGuestMode();
                                        navigate(from, { replace: true });
                                    }}
                                >
                                    <Eye className="h-4 w-4" />
                                    Explore in guest demo mode
                                </Button>
                            )}
                        </div>

                        <SecurityNote className="mt-8 border-t border-border pt-5" />

                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            <Link to="/privacy" className="hover:text-foreground hover:underline">
                                Privacy Policy
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Login;
