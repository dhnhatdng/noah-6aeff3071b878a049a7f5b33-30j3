import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import ProfileEditor from '@/components/profile/ProfileEditor';
import ProfileHeaderCard from '@/components/profile/ProfileHeaderCard';
import ProfileAboutSection from '@/components/profile/ProfileAboutSection';
import MatchmakingAnswersView from '@/components/profile/MatchmakingAnswersView';
import WalletIdentityCard from '@/components/profile/WalletIdentityCard';
import ProfileDataCard from '@/components/profile/ProfileDataCard';
import ProfileCompletionCard from '@/components/overview/ProfileCompletionCard';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { normalizeProfileData } from '@/lib/profile/normalize';
import { emptyProfileData, type ProfileData } from '@/lib/profile/types';
import { isEditorTab, type EditorTab } from '@/lib/profile/validation';

const Profile = () => {
    const { profile, status, saveProfile } = useProfile();
    const [params, setParams] = useSearchParams();

    const editParam = params.get('edit');
    const editing = editParam !== null;
    const editTab: EditorTab = isEditorTab(editParam) ? editParam : 'basics';

    const startEdit = (tab: EditorTab = 'basics') => setParams({ edit: tab });
    const stopEdit = () => setParams({}, { replace: true });

    const initial = useMemo<ProfileData>(
        () => (profile ? normalizeProfileData(profile) : emptyProfileData()),
        [profile],
    );

    const handleSave = async (data: ProfileData) => {
        const existed = Boolean(profile);
        await saveProfile(data);
        toast({ title: existed ? 'Profile saved' : 'Profile created', description: 'Stored in this browser.' });
        stopEdit();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const header = (
        <PageHeader
            eyebrow="My Profile"
            title="Your attendee profile"
            description="Your profile powers matchmaking and helps people decide whether to connect."
            actions={
                profile && !editing ? (
                    <Button className="rounded-xl" onClick={() => startEdit()}>
                        <Pencil className="h-4 w-4" /> Edit profile
                    </Button>
                ) : undefined
            }
        />
    );

    if (status === 'loading') {
        return (
            <div className="flex flex-col gap-8">
                {header}
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-72 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {header}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="flex min-w-0 flex-col gap-6">
                    {editing ? (
                        <ProfileEditor
                            mode={profile ? 'edit' : 'create'}
                            initial={initial}
                            initialTab={editTab}
                            onSave={handleSave}
                            onCancel={stopEdit}
                        />
                    ) : !profile ? (
                        <SurfaceCard>
                            <EmptyState
                                icon={UserRoundPlus}
                                title="You haven’t created a profile yet"
                                description="Add who you are, what you’re building and who you want to meet. Takes about five minutes."
                                action={
                                    <Button className="rounded-xl" onClick={() => startEdit()}>
                                        Create profile
                                    </Button>
                                }
                            />
                        </SurfaceCard>
                    ) : (
                        <>
                            <ProfileHeaderCard profile={profile} />
                            <SurfaceCard
                                title="About"
                                action={
                                    <Button variant="outline" size="sm" className="rounded-lg border-border" onClick={() => startEdit('professional')}>
                                        Edit
                                    </Button>
                                }
                            >
                                <ProfileAboutSection profile={profile} />
                            </SurfaceCard>
                            <SurfaceCard
                                title="Matchmaking profile"
                                description="Used to suggest introductions. Edit any time."
                                action={
                                    <Button variant="outline" size="sm" className="rounded-lg border-border" onClick={() => startEdit('matchmaking')}>
                                        Edit answers
                                    </Button>
                                }
                            >
                                <MatchmakingAnswersView answers={profile.matchmaking} />
                            </SurfaceCard>
                        </>
                    )}
                </div>

                <aside className="flex flex-col gap-6">
                    <WalletIdentityCard />
                    {profile && !editing && <ProfileCompletionCard />}
                    <ProfileDataCard />
                </aside>
            </div>
        </div>
    );
};

export default Profile;
