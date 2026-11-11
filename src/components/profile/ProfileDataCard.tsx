import type { ReactNode } from 'react';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import { useProfile } from '@/hooks/useProfile';
import { DEMO_PROFILES } from '@/lib/profile/demoProfiles';
import DeleteProfileDialog from './DeleteProfileDialog';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
    </div>
);

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Where profile data lives and what is (not yet) synced. */
const ProfileDataCard = ({ className }: { className?: string }) => {
    const { profile, storageKind } = useProfile();

    return (
        <SurfaceCard title="Profile data" description="Where your profile is stored." className={className}>
            <dl className="divide-y divide-border">
                <Row label="Storage">{storageKind === 'local' ? 'This browser only' : 'Cloud'}</Row>
                <Row label="Cloud sync">
                    {storageKind === 'supabase' ? (
                        <StatusPill variant="success" dot>
                            Synced
                        </StatusPill>
                    ) : (
                        <StatusPill dot>This browser only</StatusPill>
                    )}
                </Row>
                <Row label="Your profile">
                    {profile ? <span className="font-mono text-xs">{profile.id.slice(0, 8)}…</span> : 'Not created'}
                </Row>
                {profile && (
                    <>
                        <Row label="Created">{formatDate(profile.createdAt)}</Row>
                        <Row label="Last updated">{formatDate(profile.updatedAt)}</Row>
                    </>
                )}
                {/* Demo profiles only exist in local demo mode; in live mode
                    this row would wrongly imply the real attendee list is
                    fictional, so hide it when the profile lives in Supabase. */}
                {storageKind === 'local' && (
                    <Row label="Demo profiles">{DEMO_PROFILES.length} fictional, read-only, kept separate</Row>
                )}
            </dl>
            {profile && (
                <div className="mt-4">
                    <DeleteProfileDialog />
                </div>
            )}
        </SurfaceCard>
    );
};

export default ProfileDataCard;
