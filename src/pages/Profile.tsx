import { UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import FormField from '@/components/common/FormField';
import WalletStatusCard from '@/components/wallet/WalletStatusCard';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { shortenAddress } from '@/lib/wallet';

const ProfilePreview = () => {
    const { address } = useWalletConnect();
    return (
        <SurfaceCard title="Profile preview" description="How other attendees will see you.">
            <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
                    <UserRound className="h-7 w-7" aria-hidden />
                </span>
                <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">Unnamed attendee</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                        {address ? shortenAddress(address, 6) : 'No wallet connected'}
                    </p>
                </div>
            </div>
            <p className="mt-4 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-muted-foreground">
                No role, bio or interests added yet.
            </p>
        </SurfaceCard>
    );
};

const Profile = () => (
    <div className="flex flex-col gap-8">
        <PageHeader
            eyebrow="My Profile"
            title="Your attendee profile"
            description="Your profile powers matchmaking and helps people decide whether to connect."
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <SurfaceCard
                title="Profile details"
                description="Profile storage will be enabled in the next phase."
                action={<StatusPill variant="warning">Coming next phase</StatusPill>}
            >
                <fieldset disabled className="grid gap-5 opacity-80 sm:grid-cols-2">
                    <FormField label="Display name" htmlFor="name">
                        <Input id="name" placeholder="e.g. Alex Rivera" className="rounded-xl border-border bg-background" />
                    </FormField>
                    <FormField label="Role" htmlFor="role">
                        <Input id="role" placeholder="e.g. Protocol engineer" className="rounded-xl border-border bg-background" />
                    </FormField>
                    <FormField label="Organisation" htmlFor="org">
                        <Input id="org" placeholder="Company or project" className="rounded-xl border-border bg-background" />
                    </FormField>
                    <FormField label="X / Twitter" htmlFor="x">
                        <Input id="x" placeholder="@handle" className="rounded-xl border-border bg-background" />
                    </FormField>
                    <FormField label="Bio" htmlFor="bio" className="sm:col-span-2" hint="A few lines on what you’re building.">
                        <Textarea id="bio" rows={4} className="rounded-xl border-border bg-background" />
                    </FormField>
                    <FormField label="Interests" htmlFor="interests" className="sm:col-span-2" hint="Comma-separated, e.g. DeFi, payments, DePIN">
                        <Input id="interests" className="rounded-xl border-border bg-background" />
                    </FormField>
                </fieldset>
                <div className="mt-6 flex justify-end">
                    <Button disabled className="rounded-xl">
                        Save profile
                    </Button>
                </div>
            </SurfaceCard>

            <div className="flex flex-col gap-6">
                <ProfilePreview />
                <WalletStatusCard />
            </div>
        </div>
    </div>
);

export default Profile;
