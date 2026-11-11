import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, UserCheck, UserPlus } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useConnections } from '@/hooks/useConnections';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import type { DemoProfile, UserProfile } from '@/lib/profile/types';
import { cn } from '@/lib/utils';

interface ConnectButtonProps {
    /** A demo profile in demo mode, a real attendee profile when live. */
    profile: DemoProfile | UserProfile;
    size?: 'sm' | 'default';
    className?: string;
}

const ConnectButton = ({ profile, size = 'default', className }: ConnectButtonProps) => {
    const { profile: me } = useProfile();
    const { relationTo, sendRequest, acceptRequest, isLive } = useConnections();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const first = profile.fullName.split(' ')[0];
    const base = cn('rounded-xl', className);

    const run = async (action: () => Promise<void> | void, title: string, description?: string) => {
        try {
            await action();
            toast({ title, description });
        } catch (err) {
            toast({
                title: 'Action failed',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    if (!me) {
        return (
            <Button asChild variant="outline" size={size} className={cn(base, 'border-border')}>
                <Link to="/profile?edit=basics">
                    <UserPlus className="h-4 w-4" /> Create profile to connect
                </Link>
            </Button>
        );
    }

    const relation = relationTo(profile.id);

    if (relation.state === 'accepted') {
        return (
            <Button variant="outline" size={size} disabled className={cn(base, 'border-success/40 text-success disabled:opacity-100')}>
                <UserCheck className="h-4 w-4" /> Connected
            </Button>
        );
    }

    if (relation.state === 'pending' && relation.direction === 'sent') {
        return (
            <Button variant="outline" size={size} disabled className={cn(base, 'border-border disabled:opacity-100')}>
                <Clock className="h-4 w-4" /> Request pending
            </Button>
        );
    }

    if (relation.state === 'pending') {
        return (
            <Button
                size={size}
                className={base}
                onClick={() => run(() => acceptRequest(relation.record.id), `You're now connected with ${first}`)}
            >
                <Check className="h-4 w-4" /> Accept request
            </Button>
        );
    }

    return (
        <>
            <Button size={size} className={base} onClick={() => setConfirmOpen(true)}>
                <UserPlus className="h-4 w-4" /> Connect
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-2xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Send a connection request to {profile.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isLive
                                ? `The request will be sent to ${first}. They can accept or decline it from their Connections page.`
                                : `DEMO CONNECTIONS: the request is saved in this browser only. ${first} is a fictional demo user, so they won’t receive it and it will stay pending.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-xl"
                            onClick={() => run(() => sendRequest(profile.id), 'Connection request sent', `Pending with ${profile.fullName}.`)}
                        >
                            Send request
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ConnectButton;
