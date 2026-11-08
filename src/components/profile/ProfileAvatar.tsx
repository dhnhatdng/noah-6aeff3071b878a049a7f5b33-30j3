import { cn } from '@/lib/utils';

const SIZES = {
    sm: 'h-10 w-10 text-sm rounded-xl',
    md: 'h-14 w-14 text-lg rounded-2xl',
    lg: 'h-24 w-24 text-3xl rounded-3xl',
} as const;

interface ProfileAvatarProps {
    name: string;
    photoUrl: string | null;
    size?: keyof typeof SIZES;
    className?: string;
}

export const initialsOf = (name: string): string =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || '?';

const ProfileAvatar = ({ name, photoUrl, size = 'md', className }: ProfileAvatarProps) =>
    photoUrl ? (
        <img
            src={photoUrl}
            alt={name ? `${name}'s profile photo` : 'Profile photo'}
            className={cn(SIZES[size], 'shrink-0 border border-border object-cover', className)}
        />
    ) : (
        <span
            className={cn(
                SIZES[size],
                'grid shrink-0 place-items-center border border-primary/40 bg-primary-soft font-display font-semibold text-primary-strong',
                className,
            )}
            aria-hidden
        >
            {initialsOf(name)}
        </span>
    );

export default ProfileAvatar;
