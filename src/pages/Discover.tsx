import { useMemo, useState } from 'react';
import { Info, Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import DemoProfileCard from '@/components/profile/DemoProfileCard';
import ProfileDetailDialog from '@/components/profile/ProfileDetailDialog';
import { useConnections } from '@/hooks/useConnections';
import { DEMO_PROFILES, demoCategoryCounts, demoMatchesQuery } from '@/lib/profile/demoProfiles';
import { DEMO_CATEGORIES, type DemoCategory } from '@/lib/profile/options';
import type { DemoProfile, UserProfile } from '@/lib/profile/types';
import { cn } from '@/lib/utils';

type Filter = DemoCategory | 'all';

const Discover = () => {
    const { publicProfiles, isLive } = useConnections();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<Filter>('all');
    const [selected, setSelected] = useState<DemoProfile | UserProfile | null>(null);

    // Real attendees when live (no categories — those are a demo fixture),
    // fictional demo profiles otherwise.
    const pool: Array<DemoProfile | UserProfile> = isLive ? publicProfiles : DEMO_PROFILES;

    const counts = useMemo(() => demoCategoryCounts(), []);
    const results = useMemo(
        () =>
            pool.filter(
                (p) => (isLive || category === 'all' || (p as DemoProfile).category === category) && demoMatchesQuery(p, query),
            ),
        [pool, isLive, category, query],
    );

    const filters: { value: Filter; label: string; count: number }[] = [
        { value: 'all', label: 'All', count: DEMO_PROFILES.length },
        ...DEMO_CATEGORIES.map((c) => ({ value: c.value as Filter, label: c.label, count: counts[c.value] })),
    ];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                eyebrow="Discover People"
                title="Browse attendees"
                description="Search and filter profiles by role, skill, interest or topic."
            />

            <div
                role="note"
                className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning"
            >
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                    {isLive ? (
                        <>
                            <strong className="font-semibold">Real attendees.</strong> These profiles were created by
                            people using this app. Only profiles other attendees chose to share are listed here.
                        </>
                    ) : (
                        <>
                            <strong className="font-semibold">Demo data.</strong> Every profile below is a fictional DEMO USER
                            created for testing. None of them are real Breakpoint attendees.
                        </>
                    )}
                </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name, role, skill, interest or topic"
                        className="h-11 rounded-xl border-border bg-background pl-10"
                        aria-label="Search profiles"
                    />
                </div>
                {!isLive && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                        {filters.map((f) => {
                            const active = category === f.value;
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setCategory(f.value)}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                                        active
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground',
                                    )}
                                >
                                    {f.label}
                                    <span className={active ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}>{f.count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
                Showing {results.length} of {pool.length} {isLive ? 'attendee profiles' : 'demo profiles'}
            </p>

            {results.length === 0 ? (
                <EmptyState
                    icon={SearchX}
                    title="No profiles match"
                    description={
                        isLive && !query
                            ? 'No other attendees have created a profile yet. Check back closer to the event.'
                            : 'Try a different search term or category.'
                    }
                    className="bg-card"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-border"
                            onClick={() => {
                                setQuery('');
                                setCategory('all');
                            }}
                        >
                            Clear filters
                        </Button>
                    }
                />
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {results.map((p) => (
                        <li key={p.id}>
                            <DemoProfileCard profile={p} onOpen={() => setSelected(p)} />
                        </li>
                    ))}
                </ul>
            )}

            <ProfileDetailDialog profile={selected} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    );
};

export default Discover;
