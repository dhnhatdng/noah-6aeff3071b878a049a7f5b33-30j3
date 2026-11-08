import { Button } from '@/components/ui/button';
import StatusPill from '@/components/common/StatusPill';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import DemoUserBadge from '@/components/profile/DemoUserBadge';
import ConnectButton from '@/components/connections/ConnectButton';
import type { MatchResult } from '@/lib/matchmaking/scoring';
import { matchDetails } from './MatchExplanation';

const MatchCard = ({ match, onOpen }: { match: MatchResult; onOpen: () => void }) => {
    const p = match.profile;
    return (
        <article className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-4">
                <ProfileAvatar name={p.fullName} photoUrl={p.photoUrl} size="md" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold leading-tight">{p.fullName}</h3>
                        <DemoUserBadge />
                    </div>
                    <p className="mt-0.5 text-sm">{p.role}</p>
                    <p className="text-sm text-muted-foreground">{p.organization}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {match.isBest && <StatusPill variant="sage" dot>Best Overall Match</StatusPill>}
                        <StatusPill>{match.category}</StatusPill>
                    </div>
                </div>
                <div
                    className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-primary-soft text-center"
                    aria-label={`Match score ${match.score} out of 100`}
                >
                    <span className="leading-none">
                        <span className="block font-display text-2xl font-semibold">{match.score}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary-strong">score</span>
                    </span>
                </div>
            </div>

            <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Why this person
                </p>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed marker:text-primary-strong">
                    {match.whyRelevant.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
                {matchDetails(match).map((d) => (
                    <div key={d.label}>
                        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{d.label}</dt>
                        <dd className="mt-1 line-clamp-3 text-sm leading-relaxed">{d.text}</dd>
                    </div>
                ))}
            </dl>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button variant="outline" className="rounded-xl border-border" onClick={onOpen}>
                    View full match
                </Button>
                <ConnectButton profile={p} />
            </div>
        </article>
    );
};

export default MatchCard;
