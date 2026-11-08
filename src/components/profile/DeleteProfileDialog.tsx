import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

const DeleteProfileDialog = () => {
    const { profile, deleteProfile } = useProfile();
    const [busy, setBusy] = useState(false);
    if (!profile) return null;

    const onConfirm = async () => {
        setBusy(true);
        try {
            await deleteProfile();
            toast({ title: 'Profile deleted', description: 'Your profile was removed from this browser.' });
        } catch (err) {
            toast({
                title: 'Profile not deleted',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="rounded-xl border-border text-destructive hover:bg-destructive-soft hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" /> Delete profile
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-border bg-card">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">Delete your profile?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This permanently removes your profile, matchmaking answers and wallet link from this browser.
                        Your wallet itself is not affected. This can’t be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={busy}
                        className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete profile
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteProfileDialog;
