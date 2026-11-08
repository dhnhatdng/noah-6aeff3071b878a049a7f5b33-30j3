import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, Sparkles, Target, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import ChipList from '@/components/profile/ChipList';
import ProfileDetailDialog from '@/components/profile/ProfileDetailDialog';
import MatchCard from '@/components/matchmaking/MatchCard';
import MatchExplanation from '@/components/matchmaking/MatchExplanation';
import { useProfile } from '@/hooks/useProfile';
import { countAnswered, MATCHMAKING_QUESTIONS } from '@/lib/profile/questions';
import { DEMO_PROFILES } from '@/lib/profile/demoProfiles';
import { MATCH_WEIGHTS, SCORE_LABELS, SCORE_ORDER, matchReadiness, rankMatches, type MatchResult } from '@/lib/matchmaking/scoring';

const steps = [
    { n: '01', title: 'Share your context', body: 'Your profile, interests and what you are looking for at the event.' },
    { n: '02', title: 'Get ranked suggestions', body: 'Profiles are scored against yours and each recommendation is explained.' },
    { n: '03', title: 'Connect with intent', body: 'Send a request with context so the first conversation counts.' },
];

const weightsText = SCORE_ORDER.map((k) => `${SCORE_LABELS[k].toLowerCase()} ${MATCH_WEIGHTS[k] * 100}%`).join(', ');

const GoalsCard = () => {
    const { profile } = useProfile();
    const mm = profile?.matchmaking;
    const answered = mm ? countAnswered(mm) : 0;

    if (!mm || answered === 0) {
        return (
            <SurfaceCard title="Your goals">
                <EmptyState
                    compact
                    icon={Target}
                    title="No answers yet"
                    description="Answer the matchmaking questions so the matchmaker knows who to suggest."
                    action={
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                            <Link to="/profile?edit=matchmaking">Answer questions</Link>
                        </Button>
                    }
                />
            </SurfaceCard>
        );
    }

    return (
        <SurfaceCard
            title="Your goals"
            description={`${answered} of ${MATCHMAKING_QUESTIONS.length} questions answered`}
            action={
                <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                    <Link to="/profile?edit=matchmaking">Edit</Link>
                </Button>
            }
        >
            <div className="flex flex-col gap-4">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">At Breakpoint</p>
                    <ChipList items={mm.goals} tone="sage" empty="Not answered" />
                </div>
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Looking for</p>
                    <ChipList items={mm.lookingFor} empty="Not answered" />
                </div>
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Want to meet</p>
                    <ChipList items={mm.wantToMeet} empty="Not answered" />
                </div>
            </div>
        </SurfaceCard>
    );
};

const MatchResults = () => {
    const { profile, status } = useProfile();
    const [selected, setSelected] = useState<MatchResult | null>(null);

    // Recomputed whenever the saved profile changes (goals, skills, projects, offers, needs…).
    const outcome = useMemo(() => {
        if (!profile) return null;
        const missing = matchReadiness(profile);
        if (missing.length > 0) return { kind: 'incomplete' as const, missing };
        try {
            return { kind: 'ok' as const, ...rankMatches(profile, DEMO_PROFILES) };
        } catch (error) {
            return { kind: 'error' as const, message: error instanceof Error ? error.message : 'Unknown error' };
        }
    }, [profile]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (!profile || !outcome) {
        return (
            <SurfaceCard title="Top matches">
                <EmptyState
                    icon={UserRoundPlus}
                    title="Create your profile to get matches"
                    description="Matches are calculated from your goals, skills, projects, offers and needs."
                    action={
                        <Button asChild className="rounded-xl">
                            <Link to="/profile?edit=basics">Create profile</Link>
                        </Button>
                    }
                />
            </SurfaceCard>
        );
    }

    if (outcome.kind === 'incomplete') {
        return (
            <SurfaceCard title="Top matches">
                <EmptyState
                    icon={Target}
                    title="A few details are missing"
                    description={`To calculate matches, add: ${outcome.missing.join(', ')}.`}
                    action={
                        <Button asChild className="rounded-xl">
                            <Link to="/profile?edit=matchmaking">Complete profile</Link>
                        </Button>
                    }
                />
            </SurfaceCard>
        );
    }

    if (outcome.kind === 'error') {
        return (
            <SurfaceCard title="Top matches">
                <EmptyState icon={AlertTriangle} title="Matches couldn’t be calculated" description={outcome.message} />
            </SurfaceCard>
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-display text-2xl font-semibold">Your top {outcome.results.length} matches</h2>
                <p className="text-xs text-muted-foreground">
                    Scored {outcome.eligibleCount} demo profiles · {outcome.excludedCount} excluded · updated from your
                    profile saved {new Date(profile.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
            </div>
            {outcome.results.length === 0 ? (
                <EmptyState icon={Sparkles} title="No eligible profiles" description="No demo profiles had enough information to score." className="bg-card" />
            ) : (
                <ol className="flex flex-col gap-4">
                    {outcome.results.map((m) => (
                        <li key={m.profile.id}>
                            <MatchCard match={m} onOpen={() => setSelected(m)} />
                        </li>
                    ))}
                </ol>
            )}
            <ProfileDetailDialog profile={selected?.profile ?? null} onOpenChange={(open) => !open && setSelected(null)}>
                {selected && <MatchExplanation match={selected} />}
            </ProfileDetailDialog>
        </section>
    );
};

const Matchmaking = () => (
    <div className="flex flex-col gap-8">
        <PageHeader
            eyebrow="AI Matchmaking"
            title="Curated introductions"
            description="Matchmaking turns your profile and goals into a short list of people worth meeting."
            actions={
                <>
                    <StatusPill variant="warning" className="h-9 px-3">DEMO MATCHING</StatusPill>
                    <Button asChild className="rounded-xl">
                        <Link to="/profile?edit=matchmaking">
                            <Sparkles className="h-4 w-4" /> Update my answers
                        </Link>
                    </Button>
                </>
            }
        />

        <div role="note" className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
                <strong className="font-semibold">DEMO MATCHING.</strong> No AI service is connected. Matches come from a
                deterministic weighted score ({weightsText}) calculated from your saved profile against the fictional DEMO
                USER profiles.
            </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <SurfaceCard title="How it works" className="lg:col-span-2">
                <ol className="grid gap-4 sm:grid-cols-3">
                    {steps.map((s) => (
                        <li key={s.n} className="rounded-xl border border-border bg-background p-4">
                            <span className="font-display text-2xl font-semibold text-primary-strong">{s.n}</span>
                            <p className="mt-2 font-medium">{s.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                        </li>
                    ))}
                </ol>
            </SurfaceCard>
            <GoalsCard />
        </div>

        <MatchResults />
    </div>
);

export default Matchmaking;
