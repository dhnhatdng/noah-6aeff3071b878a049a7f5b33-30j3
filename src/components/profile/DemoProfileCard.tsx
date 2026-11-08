import { MapPin } from 'lucide-react';
import { demoCategoryLabel } from '@/lib/profile/options';
import type { DemoProfile } from '@/lib/profile/types';
import ProfileAvatar from './ProfileAvatar';
import DemoUserBadge from './DemoUserBadge';
import ChipList from './ChipList';

const DemoProfileCard = ({ profile, onOpen }: { profile: DemoProfile; onOpen: () => void }) => (
    <button
        type="button"
        onClick={onOpen}
        className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-all duration-200 ease-standard hover:-translate-y-0.5 hover:border-primary hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
        <div className="flex items-start gap-3">
            <ProfileAvatar name={profile.fullName} photoUrl={profile.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{profile.fullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                    {profile.role} · {profile.organization}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {profile.location}
                </p>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <DemoUserBadge />
            <span className="text-xs text-muted-foreground">{demoCategoryLabel(profile.category)}</span>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{profile.description}</p>
        <ChipList items={profile.skills} limit={3} className="mt-auto" />
    </button>
);

export default DemoProfileCard;
