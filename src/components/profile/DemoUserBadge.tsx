import StatusPill from '@/components/common/StatusPill';

/** Every fictional profile must carry this label wherever it is shown. */
const DemoUserBadge = ({ className }: { className?: string }) => (
    <StatusPill variant="warning" className={className} title="Fictional profile for testing. Not a real attendee.">
        DEMO USER
    </StatusPill>
);

export default DemoUserBadge;
