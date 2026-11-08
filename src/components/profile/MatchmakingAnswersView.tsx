import { MATCHMAKING_QUESTIONS } from '@/lib/profile/questions';
import type { MatchmakingAnswers } from '@/lib/profile/types';
import ChipList from './ChipList';

const MatchmakingAnswersView = ({ answers }: { answers: MatchmakingAnswers }) => (
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {MATCHMAKING_QUESTIONS.map((q) => (
            <div key={q.key} className={q.type === 'text' ? 'sm:col-span-2' : undefined}>
                <dt className="mb-2 flex items-baseline gap-2 text-sm font-medium">
                    <span className="font-display text-primary-strong">{String(q.number).padStart(2, '0')}</span>
                    {q.label}
                </dt>
                <dd>
                    {q.type === 'text' ? (
                        answers.building ? (
                            <p className="text-[15px] leading-relaxed">{answers.building}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Not answered</p>
                        )
                    ) : (
                        <ChipList items={answers[q.key]} tone="sage" empty="Not answered" />
                    )}
                </dd>
            </div>
        ))}
    </dl>
);

export default MatchmakingAnswersView;
