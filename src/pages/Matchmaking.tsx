import { Link } from 'react-router-dom';
import { Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';

const steps = [
    { n: '01', title: 'Share your context', body: 'Your profile, interests and what you are looking for at the event.' },
    { n: '02', title: 'Get ranked suggestions', body: 'The matchmaker compares goals and explains each recommendation.' },
    { n: '03', title: 'Connect with intent', body: 'Send a request with context so the first conversation counts.' },
];

const Matchmaking = () => (
    <div className="flex flex-col gap-8">
        <PageHeader
            eyebrow="AI Matchmaking"
            title="Curated introductions"
            description="Matchmaking turns your profile and goals into a short list of people worth meeting."
            actions={
                <Button disabled className="rounded-xl">
                    <Sparkles className="h-4 w-4" /> Generate matches
                </Button>
            }
        />

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

            <SurfaceCard title="Your goals">
                <EmptyState
                    compact
                    icon={Target}
                    title="No goals set"
                    description="Complete your profile so the matchmaker knows who to suggest."
                    action={
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                            <Link to="/profile">Go to profile</Link>
                        </Button>
                    }
                />
            </SurfaceCard>
        </div>

        <SurfaceCard title="Recommended matches">
            <EmptyState
                icon={Sparkles}
                title="No matches yet"
                description="Recommendations will appear here once your profile is complete and matchmaking is enabled."
            />
        </SurfaceCard>
    </div>
);

export default Matchmaking;
