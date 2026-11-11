import { Link } from 'react-router-dom';
import { Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import { useConnections } from '@/hooks/useConnections';

/** Overview card with connection counts — live Supabase counts when configured, local demo counts otherwise. */
const ConnectionsSummaryCard = () => {
    const { records, isLive } = useConnections();
    const connected = records.filter((r) => r.status === 'accepted').length;
    const received = records.filter((r) => r.status === 'pending' && r.direction === 'received').length;
    const sent = records.filter((r) => r.status === 'pending' && r.direction === 'sent').length;

    if (records.length === 0) {
        return (
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
        );
    }

    const stats = [
        { label: 'Connected', value: connected },
        { label: 'To review', value: received },
        { label: 'Pending', value: sent },
    ];

    return (
        <SurfaceCard title="Connections" description={isLive ? 'People you’ve connected with.' : 'Demo connections in this browser.'}>
            <dl className="grid grid-cols-3 gap-2">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-xl bg-secondary/60 px-3 py-3 text-center">
                        <dd className="font-display text-2xl font-semibold">{s.value}</dd>
                        <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    </div>
                ))}
            </dl>
            <Button asChild variant="outline" size="sm" className="mt-4 self-start rounded-lg border-border">
                <Link to="/connections">Open Connections</Link>
            </Button>
        </SurfaceCard>
    );
};

export default ConnectionsSummaryCard;
