import { motion } from 'framer-motion';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { useSession } from '@/hooks/useSession';
import { useProfile } from '@/hooks/useProfile';
import { shortenAddress } from '@/lib/wallet';
import { cn } from '@/lib/utils';

const WelcomeCard = ({ className }: { className?: string }) => {
    const { connected, walletName, address } = useWalletConnect();
    const { isGuest } = useSession();
    const { profile, status } = useProfile();
    const firstName = profile?.fullName.split(' ')[0];

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                'relative overflow-hidden rounded-2xl border border-primary/40 bg-primary-soft p-6 sm:p-8',
                className,
            )}
        >
            <svg
                viewBox="0 0 200 200"
                className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
            >
                <circle cx="80" cy="100" r="60" />
                <circle cx="120" cy="100" r="60" />
            </svg>
            <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Overview</p>
            <h1 className="relative mt-3 max-w-xl text-3xl font-semibold leading-[1.1] sm:text-[40px]">
                {status === 'loading'
                    ? 'Loading your profile…'
                    : firstName
                      ? `Welcome back, ${firstName}`
                      : 'Welcome to Breakpoint Connect'}
            </h1>
            <p className="relative mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                {status === 'loading'
                    ? 'Fetching your attendee profile.'
                    : connected && address
                      ? `Signed in with ${walletName} · ${shortenAddress(address)}. Complete your profile to unlock AI-curated introductions.`
                      : isGuest
                        ? 'You’re exploring in guest demo mode. Connect a wallet to create your attendee identity.'
                        : 'Connect a wallet to create your attendee identity.'}
            </p>
        </motion.section>
    );
};

export default WelcomeCard;
