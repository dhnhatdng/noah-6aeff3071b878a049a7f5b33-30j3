import StatusPill from '@/components/common/StatusPill';
import { MATCH_WEIGHTS, SCORE_LABELS, SCORE_ORDER, type MatchResult } from '@/lib/matchmaking/scoring';

export const matchDetails = (m: MatchResult) => [
    { label: 'What you can offer them', text: m.iCanOffer },
    { label: 'What they can offer you', text: m.theyCanOffer },
    { label: 'Potential collaboration', text: m.collaboration },
    { label: 'Conversation starter', text: m.starter },
];

/** Full matching explanation, shown in the match detail view. */
const MatchExplanation = ({ match }: { match: MatchResult }) => (
    <section className="flex flex-col gap-5 rounded-2xl border border-primary/40 bg-primary-soft/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold">Why you matched</h3>
            <div className="flex flex-wrap items-center gap-2">
                {match.isBest && <StatusPill variant="sage" dot>Best Overall Match</StatusPill>}
                <StatusPill>{match.category}</StatusPill>
                <span className="font-display text-xl font-semibold">{match.score}<span className="text-sm text-muted-foreground">/100</span></span>
            </div>
        </div>

        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed marker:text-primary-strong">
            {match.whyRelevant.map((line) => (
                <li key={line}>{line}</li>
            ))}
        </ul>

        <dl className="grid gap-4 sm:grid-cols-2">
            {matchDetails(match).map((d) => (
                <div key={d.label} className="rounded-xl border border-border bg-card p-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{d.label}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed">{d.text}</dd>
                </div>
            ))}
        </dl>

        <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Score breakdown · DEMO MATCHING
            </p>
            <ul className="flex flex-col gap-2.5">
                {SCORE_ORDER.map((k) => (
                    <li key={k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
                        <span>
                            {SCORE_LABELS[k]} <span className="text-muted-foreground">· {MATCH_WEIGHTS[k] * 100}%</span>
                        </span>
                        <span className="font-mono text-xs">{match.breakdown[k]}</span>
                        <span className="col-span-2 h-2 overflow-hidden rounded-full bg-card">
                            <span className="block h-full rounded-full bg-primary" style={{ width: `${match.breakdown[k]}%` }} />
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    </section>
);

export default MatchExplanation;
