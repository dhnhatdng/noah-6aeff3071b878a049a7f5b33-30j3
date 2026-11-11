import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';

const MatchmakingIntroCard = ({ className }: { className?: string }) => (
    <SurfaceCard className={className} padding="lg">
        <div className="flex h-full flex-col gap-6 sm:flex-row sm:items-center">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
                <Sparkles className="h-6 w-6" aria-hidden />
            </span>
            <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">Smart Matchmaking</p>
                <h2 className="mt-1.5 text-2xl font-semibold leading-tight">Introductions that are actually relevant</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Tell us what you’re building and who you want to meet. The matchmaker will suggest attendees whose
                    goals complement yours — and explain why.
                </p>
            </div>
            <Button asChild className="shrink-0 self-start rounded-xl sm:self-center">
                <Link to="/matchmaking">
                    Explore <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>
        </div>
    </SurfaceCard>
);

export default MatchmakingIntroCard;
