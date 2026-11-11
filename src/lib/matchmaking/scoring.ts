import type { DemoProfile, ProfileData, UserProfile } from '@/lib/profile/types';

/**
 * DEMO MATCHING — a deterministic weighted scoring model. No AI service is involved.
 * The same profile data always produces the same scores, ranking and explanations.
 */
export const MATCH_WEIGHTS = { goals: 0.3, skills: 0.25, projects: 0.2, mutual: 0.15, interests: 0.1 } as const;
export type ScoreKey = keyof typeof MATCH_WEIGHTS;
export const SCORE_ORDER: ScoreKey[] = ['goals', 'skills', 'projects', 'mutual', 'interests'];
export const SCORE_LABELS: Record<ScoreKey, string> = {
    goals: 'Goal compatibility',
    skills: 'Skills complementarity',
    projects: 'Project relevance',
    mutual: 'Mutual value',
    interests: 'Shared interests',
};

export type MatchCategory =
    | 'Best Overall Match'
    | 'Potential Co-founder'
    | 'Technical Partner'
    | 'Investor & Founder'
    | 'Business Development'
    | 'AI & Infrastructure'
    | 'Ecosystem & Community';

export interface MatchResult {
    /** A demo profile in demo mode, a real attendee profile when live. */
    profile: DemoProfile | UserProfile;
    rank: number;
    score: number;
    breakdown: Record<ScoreKey, number>;
    category: MatchCategory;
    isBest: boolean;
    whyRelevant: string[];
    iCanOffer: string;
    theyCanOffer: string;
    collaboration: string;
    starter: string;
}

export interface MatchRanking {
    results: MatchResult[];
    eligibleCount: number;
    excludedCount: number;
}

type Profileish = ProfileData & { id?: string };

// ── Vocabularies ───────────────────────────────────────────────
const GOAL_COMPLEMENTS: Record<string, string[]> = {
    'Raise funding': ['Find deal flow'],
    'Meet investors': ['Find deal flow'],
    'Find deal flow': ['Raise funding', 'Meet investors', 'Showcase a product'],
    'Hire talent': ['Find job opportunities'],
    'Recruit contributors': ['Find job opportunities', 'Explore collaborations', 'Learn about the ecosystem'],
    'Find job opportunities': ['Hire talent', 'Recruit contributors'],
    'Find a co-founder': ['Find a co-founder', 'Explore collaborations'],
    'Find users or customers': ['Find partners & integrations', 'Explore collaborations', 'Learn about the ecosystem'],
    'Find partners & integrations': ['Find partners & integrations', 'Find users or customers', 'Explore collaborations'],
    'Showcase a product': ['Find deal flow', 'Learn about the ecosystem', 'Find users or customers'],
    'Learn about the ecosystem': ['Showcase a product', 'Recruit contributors'],
    'Explore collaborations': ['Explore collaborations', 'Find partners & integrations', 'Recruit contributors'],
};

const IDENTITY_TO_MEET: Record<string, string> = {
    Founder: 'Founders',
    Developer: 'Developers & builders',
    Builder: 'Developers & builders',
    Investor: 'Investors',
    'AI specialist': 'AI & infrastructure specialists',
    'Infrastructure specialist': 'AI & infrastructure specialists',
    'Community manager': 'Community & ecosystem managers',
    'Ecosystem manager': 'Community & ecosystem managers',
    'Product manager': 'Product & marketing specialists',
    Marketer: 'Product & marketing specialists',
    Researcher: 'Researchers',
    Designer: 'Designers',
};

/** Which free-text skills/expertise can satisfy a structured need. */
const NEED_SKILL_KEYWORDS: Record<string, string[]> = {
    'Smart contract development': ['anchor', 'rust', 'smart contract', 'solana program'],
    'Security review': ['security', 'audit', 'threat', 'static analysis', 'fuzz'],
    'Technical advice': ['system design', 'rust', 'typescript', 'backend', 'engineering', 'architecture'],
    'Design & UX': ['design', 'figma', 'ux', 'interaction', 'usability'],
    'AI / ML expertise': ['machine learning', 'llm', 'pytorch', 'prompt', 'vector', 'agent'],
    'Data & analytics': ['sql', 'analytics', 'dbt', 'indexing', 'data'],
    'Infrastructure & RPC': ['rpc', 'kubernetes', 'validator', 'infrastructure', 'networking', 'observability'],
    'Go-to-market': ['go-to-market', 'growth', 'marketing', 'launch', 'positioning'],
    'Community growth': ['community', 'event', 'developer relations', 'content', 'public speaking'],
    Funding: ['investing', 'due diligence', 'venture'],
    'Fundraising advice': ['fundraising', 'due diligence', 'investing', 'financial'],
    'Product feedback': ['product', 'user research', 'roadmap'],
    'Partnerships & integrations': ['partnership', 'integration'],
    'Distribution & users': ['growth', 'community', 'distribution', 'acquisition'],
    'Hiring / talent': ['recruit', 'hiring', 'talent'],
    Mentorship: ['leadership', 'mentor'],
    'Grants guidance': ['grant', 'ecosystem'],
};

const TECHNICAL_OFFERS = ['Smart contract development', 'Technical advice', 'Security review'];
const BIZDEV_OFFERS = ['Partnerships & integrations', 'Go-to-market', 'Distribution & users', 'Introductions'];

const STOP = new Set(
    'and the for with that this from their your into across about more than team teams building build built make makes using based real other people what where while without within over they them have help helps work works first new are you our its can all use who how one two app apps'.split(
        ' ',
    ),
);
const KEEP_SHORT = new Set(['ai', 'ml', 'zk', 'ux']);

// ── Helpers ────────────────────────────────────────────────────
const lc = (s: string) => s.trim().toLowerCase();
const ratio = (n: number, d: number) => (d > 0 ? Math.min(1, n / d) : 0);
const intersect = (a: string[], b: string[]) => {
    const set = new Set(b.map(lc));
    return a.filter((x) => set.has(lc(x)));
};
const uniq = (xs: string[]) => {
    const seen = new Set<string>();
    return xs.filter((x) => {
        const k = lc(x);
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};
/** Lower-cases the first letter unless the first word is an acronym or camel-case (AI, DeFi). */
const lowerFirst = (s: string) => {
    const word = s.split(' ')[0];
    return word.slice(1) === word.slice(1).toLowerCase() ? s.charAt(0).toLowerCase() + s.slice(1) : s;
};
const listText = (items: string[], n = 3) => {
    const xs = items.slice(0, n);
    return xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
};
const tokens = (text: string): Set<string> =>
    new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .map((t) => (t.length > 4 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t))
            .filter((t) => (t.length >= 3 || KEEP_SHORT.has(t)) && !STOP.has(t)),
    );
const firstName = (p: ProfileData) => p.fullName.trim().split(/\s+/)[0] || 'They';
const is = (p: ProfileData, who: string) => p.matchmaking.whoIAm.includes(who);
const identityKey = (p: ProfileData) => `${lc(p.fullName)}|${lc(p.organization)}`;
const projectText = (p: ProfileData) =>
    [p.matchmaking.building, ...p.projects.map((x) => `${x.name} ${x.summary}`), ...p.expertise].join(' ');
const interestList = (p: ProfileData) => [...p.interests, ...p.matchmaking.meetingTopics];

/** Lists what is missing for a profile to be matchable. Empty array = ready. */
export const matchReadiness = (p: ProfileData): string[] => {
    const missing: string[] = [];
    if (!p.fullName.trim() || !p.role.trim()) missing.push('Name and role');
    if (p.skills.length + p.expertise.length === 0) missing.push('Skills or expertise');
    if (p.matchmaking.goals.length === 0) missing.push('Goals at Breakpoint');
    if (p.matchmaking.canOffer.length + p.matchmaking.lookingFor.length === 0) {
        missing.push('What you can offer or are looking for');
    }
    return missing;
};

const goalPairs = (a: ProfileData, b: ProfileData): [string, string][] =>
    a.matchmaking.goals.flatMap((g) => {
        const hit = (GOAL_COMPLEMENTS[g] ?? []).find((x) => b.matchmaking.goals.includes(x));
        return hit ? [[g, hit] as [string, string]] : [];
    });

const meetHit = (a: ProfileData, b: ProfileData): string | null => {
    const cats = new Set(b.matchmaking.whoIAm.map((w) => IDENTITY_TO_MEET[w]).filter(Boolean));
    return a.matchmaking.wantToMeet.find((m) => cats.has(m)) ?? null;
};

/** Needs of one profile that the other's skills/expertise can cover. */
const coverage = (needs: string[], provider: ProfileData) => {
    const list = [...provider.skills, ...provider.expertise];
    const hay = list.join(' | ').toLowerCase();
    return needs.flatMap((need) => {
        const kw = (NEED_SKILL_KEYWORDS[need] ?? []).find((k) => hay.includes(k));
        if (!kw) return [];
        return [{ need, skill: list.find((s) => s.toLowerCase().includes(kw)) ?? kw }];
    });
};

const analyse = (u: ProfileData, c: ProfileData) => {
    const um = u.matchmaking;
    const cm = c.matchmaking;

    const goalsFwd = goalPairs(u, c);
    const goalsRev = goalPairs(c, u);
    const meetFwd = meetHit(u, c);
    const meetRev = meetHit(c, u);
    const goals =
        0.35 * ratio(goalsFwd.length, um.goals.length) +
        0.2 * ratio(goalsRev.length, cm.goals.length) +
        0.3 * (meetFwd ? 1 : 0) +
        0.15 * (meetRev ? 1 : 0);

    const covFwd = coverage(um.lookingFor, c);
    const covRev = coverage(cm.lookingFor, u);
    const mine = new Set([...u.skills, ...u.expertise].map(lc));
    const distinct = c.skills.filter((s) => !mine.has(lc(s)));
    const skills =
        0.5 * ratio(covFwd.length, um.lookingFor.length) +
        0.25 * ratio(covRev.length, cm.lookingFor.length) +
        0.25 * ratio(distinct.length, c.skills.length);

    const sharedTopics = intersect(cm.meetingTopics, um.meetingTopics);
    const userTerms = tokens(projectText(u));
    const sharedTerms = [...tokens(projectText(c))].filter((t) => userTerms.has(t));
    const projects =
        0.7 * ratio(sharedTerms.length, 3) +
        0.3 * ratio(sharedTopics.length, Math.min(um.meetingTopics.length, cm.meetingTopics.length));

    const mutualFwd = intersect(cm.canOffer, um.lookingFor); // they offer what I need
    const mutualRev = intersect(um.canOffer, cm.lookingFor); // I offer what they need
    const mutual = 0.6 * ratio(mutualFwd.length, um.lookingFor.length) + 0.4 * ratio(mutualRev.length, cm.lookingFor.length);

    const userInterestTerms = tokens(interestList(u).join(' '));
    const sharedInterests = uniq(interestList(c).filter((i) => [...tokens(i)].some((t) => userInterestTerms.has(t))));
    const interests = ratio(sharedInterests.length, Math.min(interestList(u).length, interestList(c).length, 3));

    return {
        breakdown: { goals, skills, projects, mutual, interests } as Record<ScoreKey, number>,
        goalsFwd,
        goalsRev,
        meetFwd,
        covFwd,
        covRev,
        distinct,
        sharedTopics,
        sharedTerms,
        mutualFwd,
        mutualRev,
        sharedInterests,
    };
};

type Analysis = ReturnType<typeof analyse>;

const categorise = (u: ProfileData, c: ProfileData): MatchCategory => {
    if ((is(u, 'Investor') && is(c, 'Founder')) || (is(u, 'Founder') && is(c, 'Investor'))) return 'Investor & Founder';
    const userWantsCofounder =
        u.matchmaking.goals.includes('Find a co-founder') || u.matchmaking.lookingFor.includes('Co-founder');
    if (userWantsCofounder && !is(c, 'Investor')) return 'Potential Co-founder';
    if (is(c, 'AI specialist') || is(c, 'Infrastructure specialist')) return 'AI & Infrastructure';
    if (intersect(c.matchmaking.canOffer, TECHNICAL_OFFERS).length && (is(c, 'Developer') || intersect(u.matchmaking.lookingFor, TECHNICAL_OFFERS).length)) {
        return 'Technical Partner';
    }
    if (is(c, 'Community manager') || is(c, 'Ecosystem manager')) return 'Ecosystem & Community';
    if (intersect(c.matchmaking.canOffer, BIZDEV_OFFERS).length) return 'Business Development';
    return is(c, 'Developer') ? 'Technical Partner' : 'Business Development';
};

const buildResult = (u: ProfileData, c: DemoProfile | UserProfile, a: Analysis, score: number, index: number): MatchResult => {
    const name = firstName(c);
    const um = u.matchmaking;
    const cm = c.matchmaking;
    const project = c.projects[0]?.name;

    const reasons: Record<ScoreKey, string | null> = {
        goals: a.goalsFwd[0]
            ? `You want to ${lowerFirst(a.goalsFwd[0][0])}; ${name} wants to ${lowerFirst(a.goalsFwd[0][1])}.`
            : a.meetFwd
              ? `${name} is one of the ${lowerFirst(a.meetFwd)} you want to meet.`
              : a.goalsRev[0]
                ? `${name} wants to ${lowerFirst(a.goalsRev[0][0])}, which fits your goal to ${lowerFirst(a.goalsRev[0][1])}.`
                : null,
        skills: a.covFwd[0]
            ? `Their ${a.covFwd[0].skill} background covers your need for ${lowerFirst(a.covFwd[0].need)}.`
            : a.distinct.length
              ? `Brings skills you don't list yourself: ${listText(a.distinct)}.`
              : null,
        projects: a.sharedTopics.length
            ? `You both work around ${listText(a.sharedTopics, 2)}${project ? ` (see ${project})` : ''}.`
            : a.sharedTerms.length
              ? `${project ?? 'Their work'} overlaps with what you're building: ${listText(a.sharedTerms)}.`
              : null,
        mutual: a.mutualFwd.length
            ? `Offers ${listText(a.mutualFwd.map(lowerFirst), 2)}, which you're looking for.`
            : a.mutualRev.length
              ? `Needs ${listText(a.mutualRev.map(lowerFirst), 2)}, which you offer.`
              : null,
        interests: a.sharedInterests.length ? `Shared interests: ${listText(a.sharedInterests)}.` : null,
    };
    const whyRelevant = SCORE_ORDER.filter((k) => reasons[k])
        .sort((x, y) => a.breakdown[y] * MATCH_WEIGHTS[y] - a.breakdown[x] * MATCH_WEIGHTS[x])
        .slice(0, 3)
        .map((k) => reasons[k] as string);
    if (whyRelevant.length === 0) whyRelevant.push(`${name}'s profile overlaps only weakly with yours, and the score reflects that.`);

    const iCanOffer = a.mutualRev.length
        ? `${name} is looking for ${listText(a.mutualRev.map(lowerFirst))}, which you offer.`
        : a.covRev[0]
          ? `Your ${a.covRev[0].skill} skills could help with their need for ${lowerFirst(a.covRev[0].need)}.`
          : cm.lookingFor.length
            ? `No direct overlap with your offers. They're looking for ${listText(cm.lookingFor.map(lowerFirst), 2)}.`
            : "They haven't listed what they need.";

    const theyCanOffer = a.mutualFwd.length
        ? `${listText(a.mutualFwd)}, which is on your "looking for" list.`
        : a.covFwd[0]
          ? `Hands-on ${a.covFwd[0].skill} for your need: ${lowerFirst(a.covFwd[0].need)}.`
          : cm.canOffer.length
            ? `Not a direct match for your needs. They offer ${listText(cm.canOffer.map(lowerFirst), 2)}.`
            : "They haven't listed what they offer.";

    const sharedCollab = intersect(cm.collaboration, um.collaboration);
    const context = project ?? c.organization;
    const collaboration = sharedCollab.length
        ? `${sharedCollab[0]}${sharedCollab[1] ? ` or ${lowerFirst(sharedCollab[1])}` : ''} around ${context}, a format you both prefer.`
        : cm.collaboration[0]
          ? `${name} prefers ${lowerFirst(cm.collaboration[0])}${um.collaboration[0] ? `; you prefer ${lowerFirst(um.collaboration[0])}` : ''}. Worth aligning on early.`
          : `Open. Ask how ${name} likes to work.`;

    const category = categorise(u, c);
    const topic = a.sharedTopics[0];
    const myWork = u.projects[0]?.name ?? (u.organization || 'my project');
    let starter: string;
    if (category === 'Investor & Founder' && is(c, 'Investor')) {
        starter = `I'm building ${myWork}${topic ? ` in ${topic}` : ''}. What do you look for in teams at this stage?`;
    } else if (category === 'Investor & Founder') {
        starter = `How is ${project ?? 'your project'} going, and what would help most with ${lowerFirst(cm.lookingFor[0] ?? 'growth')} right now?`;
    } else {
        const opener = project
            ? `I saw you're working on ${project}.`
            : `I read that you focus on ${lowerFirst(c.expertise[0] ?? c.role)}.`;
        const ask = a.mutualRev[0]
            ? `You mentioned looking for ${lowerFirst(a.mutualRev[0])}, which I can help with.`
            : a.covRev[0]
              ? `My ${a.covRev[0].skill} background might help with ${lowerFirst(a.covRev[0].need)}.`
              : topic
                ? `How are you approaching ${topic} there?`
                : a.mutualFwd[0]
                  ? `I'd value your take on ${lowerFirst(a.mutualFwd[0])} for what I'm building.`
                  : "What's the biggest open problem you're working through?";
        starter = `${opener} ${ask}`;
    }

    return {
        profile: c,
        rank: index + 1,
        score,
        breakdown: Object.fromEntries(SCORE_ORDER.map((k) => [k, Math.round(a.breakdown[k] * 100)])) as Record<ScoreKey, number>,
        category,
        isBest: index === 0,
        whyRelevant,
        iCanOffer,
        theyCanOffer,
        collaboration,
        starter: `"${starter}"`,
    };
};

/**
 * Scores every eligible candidate against the user and returns the top `limit`.
 * Excludes the user themself, duplicates (same id or same name + organisation) and incomplete profiles.
 */
export const rankMatches = (user: Profileish, candidates: Array<DemoProfile | UserProfile>, limit = 5): MatchRanking => {
    const selfKey = identityKey(user);
    const seen = new Set<string>();
    let excludedCount = 0;

    const eligible = candidates.filter((c) => {
        const key = identityKey(c);
        const duplicate = seen.has(c.id) || seen.has(key);
        seen.add(c.id);
        seen.add(key);
        const ok = !duplicate && c.id !== user.id && key !== selfKey && matchReadiness(c).length === 0;
        if (!ok) excludedCount += 1;
        return ok;
    });

    const scored = eligible
        .map((c) => {
            const a = analyse(user, c);
            const score = Math.round(100 * SCORE_ORDER.reduce((sum, k) => sum + MATCH_WEIGHTS[k] * a.breakdown[k], 0));
            return { c, a, score };
        })
        .sort((x, y) => y.score - x.score || x.c.fullName.localeCompare(y.c.fullName));

    return {
        results: scored.slice(0, limit).map((s, i) => buildResult(user, s.c, s.a, s.score, i)),
        eligibleCount: eligible.length,
        excludedCount,
    };
};
