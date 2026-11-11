import StatusPill from '@/components/common/StatusPill';
import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Shows which backend the app is running against:
 * "Connected — Supabase" when the project is configured, otherwise
 * "Demo mode — data stays in this browser" (localStorage only).
 */
const DataModeBadge = ({ className }: { className?: string }) =>
    isSupabaseConfigured() ? (
        <StatusPill variant="success" dot className={className}>
            Connected — Supabase
        </StatusPill>
    ) : (
        <StatusPill variant="neutral" dot className={className}>
            Demo mode — data stays in this browser
        </StatusPill>
    );

export default DataModeBadge;
