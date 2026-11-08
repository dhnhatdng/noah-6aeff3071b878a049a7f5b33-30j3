import type { ReactNode } from 'react';
import { Building2, Github, Globe, Linkedin, MapPin, Twitter, type LucideIcon } from 'lucide-react';
import { linkHref, linkLabel, type LinkKind } from '@/lib/profile/links';
import type { ProfileData } from '@/lib/profile/types';
import { cn } from '@/lib/utils';
import ProfileAvatar from './ProfileAvatar';
import DemoUserBadge from './DemoUserBadge';

const LINK_META: { kind: LinkKind; icon: LucideIcon; label: string }[] = [
    { kind: 'website', icon: Globe, label: 'Website' },
    { kind: 'x', icon: Twitter, label: 'X profile' },
    { kind: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
    { kind: 'github', icon: Github, label: 'GitHub' },
];

interface ProfileHeaderCardProps {
    profile: ProfileData;
    isDemo?: boolean;
    actions?: ReactNode;
    plain?: boolean;
    className?: string;
}

const ProfileHeaderCard = ({ profile, isDemo, actions, plain, className }: ProfileHeaderCardProps) => {
    const links = LINK_META.map((m) => ({ ...m, href: linkHref(m.kind, profile.links[m.kind]) })).filter((m) => m.href);

    return (
        <section
            className={cn(
                !plain && 'relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7',
                className,
            )}
        >
            {!plain && <div className="absolute inset-x-0 top-0 h-20 bg-primary-soft" aria-hidden />}
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
                <ProfileAvatar name={profile.fullName} photoUrl={profile.photoUrl} size="lg" className="shadow-card" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl font-semibold leading-tight">{profile.fullName || 'Unnamed'}</h2>
                        {isDemo && <DemoUserBadge />}
                    </div>
                    <p className="mt-1 text-[15px]">{profile.role || 'No role added'}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {profile.organization && (
                            <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" aria-hidden /> {profile.organization}
                            </span>
                        )}
                        {profile.location && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" aria-hidden /> {profile.location}
                            </span>
                        )}
                    </div>
                </div>
                {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
            </div>
            {links.length > 0 && (
                <ul className="relative mt-5 flex flex-wrap gap-2">
                    {links.map(({ kind, icon: Icon, label, href }) => (
                        <li key={kind}>
                            <a
                                href={href ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                aria-label={label}
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium transition-colors hover:border-primary"
                            >
                                <Icon className="h-4 w-4 text-primary-strong" aria-hidden />
                                <span className="max-w-[180px] truncate">{linkLabel(kind, profile.links[kind])}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default ProfileHeaderCard;
