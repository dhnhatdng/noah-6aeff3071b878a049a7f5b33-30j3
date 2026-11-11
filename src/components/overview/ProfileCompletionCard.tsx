import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SurfaceCard from '@/components/common/SurfaceCard';
import { useProfile } from '@/hooks/useProfile';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

const RADIUS = 42;
const CIRC = 2 * Math.PI * RADIUS;

const ProfileCompletionCard = ({ className }: { className?: string }) => {
    const { completed, total, percent } = useProfileCompletion();
    const { status } = useProfile();

    // While the profile is still loading, show a placeholder — never the
    // empty 0% state, which reads as "no profile" and is wrong.
    if (status === 'loading') {
        return (
            <SurfaceCard title="Profile completion" className={className}>
                <div className="flex flex-1 items-center gap-5">
                    <div className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-secondary" aria-hidden />
                    <p className="text-sm text-muted-foreground">Loading your profile…</p>
                </div>
            </SurfaceCard>
        );
    }

    return (
        <SurfaceCard title="Profile completion" className={className}>
            <div className="flex flex-1 items-center gap-5">
                <div className="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
                        <circle cx="50" cy="50" r={RADIUS} className="stroke-secondary" strokeWidth="9" fill="none" />
                        <circle
                            cx="50"
                            cy="50"
                            r={RADIUS}
                            className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-standard"
                            strokeWidth="9"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={CIRC}
                            strokeDashoffset={CIRC - (CIRC * percent) / 100}
                        />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center font-display text-2xl font-semibold">
                        {percent}%
                    </span>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{completed}</span> of {total} steps complete
                    </p>
                    <Link
                        to="/profile"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline"
                    >
                        Complete profile <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </SurfaceCard>
    );
};

export default ProfileCompletionCard;
