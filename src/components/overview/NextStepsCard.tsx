import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import SurfaceCard from '@/components/common/SurfaceCard';
import { useProfile } from '@/hooks/useProfile';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { cn } from '@/lib/utils';

const NextStepsCard = ({ className }: { className?: string }) => {
    const { steps } = useProfileCompletion();
    const { status } = useProfile();

    // Same flash as the completion ring: while loading, every step would
    // wrongly show "To do".
    if (status === 'loading') {
        return (
            <SurfaceCard title="Suggested next steps" description="Work through these to get the most out of the event." className={className}>
                <p className="py-3 text-sm text-muted-foreground">Loading your profile…</p>
            </SurfaceCard>
        );
    }

    return (
        <SurfaceCard title="Suggested next steps" description="Work through these to get the most out of the event." className={className}>
            <ol className="flex flex-col divide-y divide-border">
                {steps.map((step) => (
                    <li key={step.id}>
                        <Link
                            to={step.to}
                            className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-secondary/60"
                        >
                            {step.done ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Done" />
                            ) : (
                                <Circle className="h-5 w-5 shrink-0 text-border" aria-label="To do" />
                            )}
                            <span className="min-w-0 flex-1">
                                <span className={cn('block text-sm font-medium', step.done && 'text-muted-foreground line-through')}>
                                    {step.label}
                                </span>
                                <span className="block text-xs text-muted-foreground">{step.description}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </li>
                ))}
            </ol>
        </SurfaceCard>
    );
};

export default NextStepsCard;
