import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { DemoProfile } from '@/lib/profile/types';
import ProfileHeaderCard from './ProfileHeaderCard';
import ProfileAboutSection from './ProfileAboutSection';
import MatchmakingAnswersView from './MatchmakingAnswersView';

interface ProfileDetailDialogProps {
    profile: DemoProfile | null;
    onOpenChange: (open: boolean) => void;
}

const ProfileDetailDialog = ({ profile, onOpenChange }: ProfileDetailDialogProps) => (
    <Dialog open={Boolean(profile)} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-border bg-card p-0 shadow-raised sm:max-w-3xl">
            {profile && (
                <>
                    <DialogTitle className="sr-only">{profile.fullName} (demo profile)</DialogTitle>
                    <DialogDescription className="flex items-start gap-2 border-b border-warning/20 bg-warning-soft px-6 py-3 pr-12 text-xs text-warning">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                        DEMO USER — a fictional profile created for testing. Not a real Breakpoint attendee.
                    </DialogDescription>
                    <div className="flex flex-col gap-8 p-6">
                        <ProfileHeaderCard profile={profile} isDemo plain />
                        <section className="flex flex-col gap-4">
                            <h3 className="font-display text-lg font-semibold">About</h3>
                            <ProfileAboutSection profile={profile} />
                        </section>
                        <section className="flex flex-col gap-4 border-t border-border pt-6">
                            <h3 className="font-display text-lg font-semibold">Matchmaking profile</h3>
                            <MatchmakingAnswersView answers={profile.matchmaking} />
                        </section>
                    </div>
                </>
            )}
        </DialogContent>
    </Dialog>
);

export default ProfileDetailDialog;
