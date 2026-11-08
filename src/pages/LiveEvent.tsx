import { CalendarDays, QrCode, Radio } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';

const LiveEvent = () => (
    <div className="flex flex-col gap-8">
        <PageHeader
            eyebrow="Live Event"
            title="On the ground"
            description="Schedule, what’s happening now and event check-in — all in one place."
        />

        <div className="grid gap-6 lg:grid-cols-3">
            <SurfaceCard
                title="Happening now"
                action={<StatusPill dot>Not live</StatusPill>}
                className="lg:col-span-2"
            >
                <EmptyState
                    icon={Radio}
                    title="No live sessions"
                    description="Live sessions and announcements will appear here during the event."
                />
            </SurfaceCard>
            <SurfaceCard title="Check-in">
                <EmptyState
                    compact
                    icon={QrCode}
                    title="Check-in unavailable"
                    description="Event check-in opens once event data is connected."
                />
            </SurfaceCard>
        </div>

        <SurfaceCard title="Event schedule" description="Sessions, workshops and side events.">
            <EmptyState
                icon={CalendarDays}
                title="Schedule not published yet"
                description="The agenda will be listed here once it is available."
            />
        </SurfaceCard>
    </div>
);

export default LiveEvent;
