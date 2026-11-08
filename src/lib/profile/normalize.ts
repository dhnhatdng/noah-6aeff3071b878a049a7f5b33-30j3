import { EXPERIENCE_LEVELS, type ExperienceLevel } from './options';
import { generateId } from './ids';
import type { MatchmakingAnswers, ProfileData, ProfileProject, SocialLinks } from './types';

export const LIMITS = {
    shortText: 80,
    location: 80,
    description: 800,
    experience: 600,
    building: 400,
    projectName: 60,
    projectSummary: 240,
    maxProjects: 5,
    maxTags: 15,
    tagLength: 40,
    maxPhotoChars: 400_000,
} as const;

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const strList = (v: unknown, maxItems: number = LIMITS.maxTags): string[] => {
    if (!Array.isArray(v)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of v) {
        if (typeof item !== 'string') continue;
        const clean = item.trim().slice(0, LIMITS.tagLength);
        const key = clean.toLowerCase();
        if (!clean || seen.has(key)) continue;
        seen.add(key);
        out.push(clean);
        if (out.length >= maxItems) break;
    }
    return out;
};

const photo = (v: unknown): string | null => {
    if (typeof v !== 'string' || v.length > LIMITS.maxPhotoChars) return null;
    return /^data:image\/(png|jpe?g|webp);base64,/.test(v) || v.startsWith('https://') ? v : null;
};

const projects = (v: unknown): ProfileProject[] =>
    (Array.isArray(v) ? v : [])
        .map((p) => {
            const o = asObj(p);
            return {
                id: typeof o.id === 'string' && o.id ? o.id : generateId(),
                name: str(o.name, LIMITS.projectName),
                summary: str(o.summary, LIMITS.projectSummary),
            };
        })
        .filter((p) => p.name || p.summary)
        .slice(0, LIMITS.maxProjects);

const links = (v: unknown): SocialLinks => {
    const o = asObj(v);
    return {
        website: str(o.website, 200),
        x: str(o.x, 200),
        linkedin: str(o.linkedin, 200),
        github: str(o.github, 200),
    };
};

const matchmaking = (v: unknown): MatchmakingAnswers => {
    const o = asObj(v);
    return {
        whoIAm: strList(o.whoIAm),
        building: str(o.building, LIMITS.building),
        canOffer: strList(o.canOffer),
        lookingFor: strList(o.lookingFor),
        goals: strList(o.goals),
        wantToMeet: strList(o.wantToMeet),
        collaboration: strList(o.collaboration),
        meetingTopics: strList(o.meetingTopics),
    };
};

/**
 * Coerces any input (form draft, localStorage JSON, future DB row) into a clean ProfileData.
 * Unknown keys are dropped, strings trimmed and length-limited, lists de-duplicated.
 */
export const normalizeProfileData = (raw: unknown): ProfileData => {
    const o = asObj(raw);
    const level = EXPERIENCE_LEVELS.some((l) => l.value === o.experienceLevel)
        ? (o.experienceLevel as ExperienceLevel)
        : '';
    return {
        fullName: str(o.fullName, LIMITS.shortText),
        photoUrl: photo(o.photoUrl),
        role: str(o.role, LIMITS.shortText),
        organization: str(o.organization, LIMITS.shortText),
        location: str(o.location, LIMITS.location),
        description: str(o.description, LIMITS.description),
        expertise: strList(o.expertise),
        skills: strList(o.skills),
        projects: projects(o.projects),
        experienceLevel: level,
        experience: str(o.experience, LIMITS.experience),
        interests: strList(o.interests),
        links: links(o.links),
        matchmaking: matchmaking(o.matchmaking),
    };
};
