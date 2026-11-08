import { Textarea } from '@/components/ui/textarea';
import MultiSelectChips from '@/components/profile/MultiSelectChips';
import { MATCHMAKING_QUESTIONS } from '@/lib/profile/questions';
import { counter, textareaClass, type EditorSectionProps } from './shared';

const EditorMatchmaking = ({ draft, update }: EditorSectionProps) => (
    <div className="flex flex-col gap-2">
        <p className="mb-2 text-sm text-muted-foreground">
            These answers power matchmaking. You can change them any time.
        </p>
        <ol className="flex flex-col divide-y divide-border">
            {MATCHMAKING_QUESTIONS.map((q) => (
                <li key={q.key} className="flex flex-col gap-3 py-5 first:pt-0">
                    <div className="flex items-baseline gap-3">
                        <span className="font-display text-lg font-semibold text-primary-strong">
                            {String(q.number).padStart(2, '0')}
                        </span>
                        <div>
                            <label htmlFor={`mm-${q.key}`} className="block font-medium">
                                {q.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{q.hint}</p>
                        </div>
                    </div>
                    {q.type === 'text' ? (
                        <div className="flex flex-col gap-1">
                            <Textarea
                                id={`mm-${q.key}`}
                                rows={3}
                                maxLength={q.maxLength}
                                value={draft.matchmaking.building}
                                onChange={(e) => update({ matchmaking: { ...draft.matchmaking, building: e.target.value } })}
                                className={textareaClass}
                            />
                            <span className="self-end text-xs text-muted-foreground">
                                {counter(draft.matchmaking.building, q.maxLength)}
                            </span>
                        </div>
                    ) : (
                        <MultiSelectChips
                            id={`mm-${q.key}`}
                            label={q.label}
                            options={q.options}
                            max={q.max}
                            value={draft.matchmaking[q.key]}
                            onChange={(v) => update({ matchmaking: { ...draft.matchmaking, [q.key]: v } })}
                        />
                    )}
                </li>
            ))}
        </ol>
    </div>
);

export default EditorMatchmaking;
