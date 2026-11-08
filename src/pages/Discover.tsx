import { Search, UsersRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';

const filters = ['All attendees', 'Builders', 'Investors', 'Founders', 'Speakers'];

const Discover = () => (
    <div className="flex flex-col gap-8">
        <PageHeader
            eyebrow="Discover People"
            title="Browse attendees"
            description="Search and filter the attendee directory to find people by role, interest or project."
        />

        <SurfaceCard>
            <div className="flex flex-col gap-4">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        disabled
                        placeholder="Search by name, role or interest"
                        className="h-11 rounded-xl border-border bg-background pl-10"
                        aria-label="Search attendees"
                    />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
                    {filters.map((f, i) => (
                        <button
                            key={f}
                            type="button"
                            disabled
                            className={
                                i === 0
                                    ? 'rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground'
                                    : 'rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground disabled:opacity-70'
                            }
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </SurfaceCard>

        <EmptyState
            icon={UsersRound}
            title="No attendee profiles to show yet"
            description="The directory will populate as attendees create their profiles. Search and filters activate then."
            className="bg-card"
        />
    </div>
);

export default Discover;
