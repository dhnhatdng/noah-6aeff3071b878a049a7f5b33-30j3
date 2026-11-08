import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from './useSession';

export interface CompletionStep {
    id: string;
    label: string;
    description: string;
    done: boolean;
    to: string;
}

/**
 * Profile completion derived only from real state.
 * Profile fields are not persisted yet (Phase 2), so they report as incomplete.
 */
export const useProfileCompletion = () => {
    const { connected } = useWallet();
    const { ownership } = useSession();

    return useMemo(() => {
        const steps: CompletionStep[] = [
            {
                id: 'wallet',
                label: 'Connect a Solana wallet',
                description: 'Your wallet is your Breakpoint identity.',
                done: connected,
                to: '/settings',
            },
            {
                id: 'ownership',
                label: 'Verify wallet ownership',
                description: 'Sign a one-time message to prove the wallet is yours.',
                done: ownership.status === 'verified',
                to: '/settings',
            },
            {
                id: 'identity',
                label: 'Add your name and role',
                description: 'Help attendees recognise you.',
                done: false,
                to: '/profile',
            },
            {
                id: 'bio',
                label: 'Write a short bio',
                description: 'A few lines on what you are building.',
                done: false,
                to: '/profile',
            },
            {
                id: 'goals',
                label: 'Set matchmaking goals',
                description: 'Tell the AI who you want to meet.',
                done: false,
                to: '/matchmaking',
            },
        ];
        const completed = steps.filter((s) => s.done).length;
        return { steps, completed, total: steps.length, percent: Math.round((completed / steps.length) * 100) };
    }, [connected, ownership.status]);
};
