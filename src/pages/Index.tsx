import { Link } from 'react-router-dom';
import { CalendarClock, Handshake, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import WelcomeCard from '@/components/overview/WelcomeCard';
import ProfileCompletionCard from '@/components/overview/ProfileCompletionCard';
import NextStepsCard from '@/components/overview/NextStepsCard';
import MatchmakingIntroCard from '@/components/overview/MatchmakingIntroCard';
import WalletStatusCard from '@/components/wallet/WalletStatusCard';

/** Overview dashboard. All figures come from real state — empty states until data exists. */
const Index = () => (
    <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
            <WelcomeCard className="lg:col-span-2" />
            <ProfileCompletionCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <MatchmakingIntroCard className="lg:col-span-2" />
            <WalletStatusCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <NextStepsCard className="lg:row-span-2" />
            <SurfaceCard title="Connections" description="People you’ve connected with.">
                <EmptyState
                    compact
                    icon={Handshake}
                    title="No connections yet"
                    description="Connections you make will appear here."
                    action={
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                            <Link to="/discover">Discover people</Link>
                        </Button>
                    }
                />
            </SurfaceCard>
            <SurfaceCard title="Upcoming meeting" description="Your next scheduled meeting.">
                <EmptyState
                    compact
                    icon={CalendarClock}
                    title="Nothing scheduled"
                    description="Meetings you book with other attendees will show here."
                />
            </SurfaceCard>
            <SurfaceCard title="Collaboration" description="Projects and shared spaces." className="lg:col-span-2">
                <EmptyState
                    compact
                    icon={Layers}
                    title="No collaborations yet"
                    description="Start or join a collaboration to keep building after the event."
                    action={
                        <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                            <Link to="/collaboration">Open Collaboration Hub</Link>
                        </Button>
                    }
                />
            </SurfaceCard>
        </div>
    </div>
);

export default Index;
