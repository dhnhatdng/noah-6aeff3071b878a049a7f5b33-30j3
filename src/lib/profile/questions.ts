import { COLLAB_OPTIONS, EXCHANGE_OPTIONS, GOAL_OPTIONS, IDENTITY_OPTIONS, MEET_OPTIONS, TOPIC_OPTIONS } from './options';
import { LIMITS } from './normalize';
import type { MatchmakingAnswers } from './types';

type MultiKey = Exclude<keyof MatchmakingAnswers, 'building'>;

export type MatchmakingQuestion =
    | { key: MultiKey; type: 'multi'; number: number; label: string; hint: string; options: readonly string[]; max: number }
    | { key: 'building'; type: 'text'; number: number; label: string; hint: string; maxLength: number };

export const MATCHMAKING_QUESTIONS: MatchmakingQuestion[] = [
    { key: 'whoIAm', type: 'multi', number: 1, label: 'Who I am', hint: 'Select everything that describes you.', options: IDENTITY_OPTIONS, max: 4 },
    { key: 'building', type: 'text', number: 2, label: 'What I am building', hint: 'One or two sentences.', maxLength: LIMITS.building },
    { key: 'canOffer', type: 'multi', number: 3, label: 'What I can offer', hint: 'How you can help others.', options: EXCHANGE_OPTIONS, max: 6 },
    { key: 'lookingFor', type: 'multi', number: 4, label: 'What I am looking for', hint: 'What would help you most right now.', options: EXCHANGE_OPTIONS, max: 6 },
    { key: 'goals', type: 'multi', number: 5, label: 'My goals at Breakpoint', hint: 'What would make the event a success.', options: GOAL_OPTIONS, max: 5 },
    { key: 'wantToMeet', type: 'multi', number: 6, label: 'Who I want to meet', hint: 'The kinds of people to prioritise.', options: MEET_OPTIONS, max: 5 },
    { key: 'collaboration', type: 'multi', number: 7, label: 'Preferred collaboration', hint: 'How you like to work with others.', options: COLLAB_OPTIONS, max: 5 },
    { key: 'meetingTopics', type: 'multi', number: 8, label: 'Preferred meeting topics', hint: 'What you want to talk about.', options: TOPIC_OPTIONS, max: 6 },
];

export const countAnswered = (m: MatchmakingAnswers): number =>
    MATCHMAKING_QUESTIONS.filter((q) => (q.type === 'text' ? m.building.trim().length > 0 : m[q.key].length > 0)).length;
