import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from './useSession';
import { useProfile } from './useProfile';
import { countAnswered } from '@/lib/profile/questions';

export interface CompletionStep {
    id: string;
    label: string;
    description: string;
    done: boolean;
    to: string;
}

/** Profile completion derived only from real, saved state. */
export const useProfileCompletion = () => {
    const { publicKey } = useWallet();
    const { ownership } = useSession();
    const { profile } = useProfile();

    return useMemo(() => {
        const answered = profile ? countAnswered(profile.matchmaking) : 0;
        const linkedAddress = profile?.wallet?.address;
        const steps: CompletionStep[] = [
            {
                id: 'create',
                label: 'Create your profile',
                description: 'Your name and role are all you need to start.',
                done: Boolean(profile),
                to: '/profile?edit=basics',
            },
            {
                id: 'about',
                label: 'Describe your work and skills',
                description: 'A short description plus a few skills.',
                done: Boolean(profile?.description && profile.skills.length > 0),
                to: '/profile?edit=basics',
            },
            {
                id: 'matchmaking',
                label: 'Answer the matchmaking questions',
                description: `${answered} of 8 answered. Tell the matchmaker who you want to meet.`,
                done: answered >= 6,
                to: '/profile?edit=matchmaking',
            },
            {
                id: 'wallet',
                label: 'Link a Solana wallet',
                description: 'Attach your wallet address to your profile.',
                done: Boolean(linkedAddress),
                to: '/profile',
            },
            {
                id: 'ownership',
                label: 'Verify wallet ownership',
                description: 'Sign a one-time message to prove the wallet is yours.',
                done: ownership.status === 'verified' && Boolean(linkedAddress) && publicKey?.toBase58() === linkedAddress,
                to: '/settings',
            },
        ];
        const completed = steps.filter((s) => s.done).length;
        return { steps, completed, total: steps.length, percent: Math.round((completed / steps.length) * 100) };
    }, [profile, ownership.status, publicKey]);
};
