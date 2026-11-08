import type { DemoCategory, ExperienceLevel } from './options';

export const PROFILE_SCHEMA_VERSION = 1;

export interface SocialLinks {
    website: string;
    x: string;
    linkedin: string;
    github: string;
}

export interface ProfileProject {
    id: string;
    name: string;
    summary: string;
}

/** The eight structured matchmaking answers. */
export interface MatchmakingAnswers {
    whoIAm: string[];
    building: string;
    canOffer: string[];
    lookingFor: string[];
    goals: string[];
    wantToMeet: string[];
    collaboration: string[];
    meetingTopics: string[];
}

/** Editable profile content, shared by user and demo profiles. */
export interface ProfileData {
    fullName: string;
    /** data:image/* (local upload) or https URL. Never javascript:/other schemes. */
    photoUrl: string | null;
    role: string;
    organization: string;
    location: string;
    description: string;
    expertise: string[];
    skills: string[];
    projects: ProfileProject[];
    experienceLevel: ExperienceLevel | '';
    experience: string;
    interests: string[];
    links: SocialLinks;
    matchmaking: MatchmakingAnswers;
}

/**
 * A wallet address the user chose to attach to their profile.
 * This is a claim, NOT proof of ownership. Verification is session-scoped and
 * will be issued by the backend once signature verification exists.
 */
export interface WalletIdentity {
    address: string;
    provider: string;
    network: string;
    linkedAt: string;
}

export interface UserProfile extends ProfileData {
    id: string;
    kind: 'user';
    schemaVersion: number;
    wallet: WalletIdentity | null;
    createdAt: string;
    updatedAt: string;
}

/** Fictional test data. Never persisted, never mixed with user profiles. */
export interface DemoProfile extends ProfileData {
    id: string;
    kind: 'demo';
    isDemo: true;
    category: DemoCategory;
}

export const emptyMatchmaking = (): MatchmakingAnswers => ({
    whoIAm: [],
    building: '',
    canOffer: [],
    lookingFor: [],
    goals: [],
    wantToMeet: [],
    collaboration: [],
    meetingTopics: [],
});

export const emptyProfileData = (): ProfileData => ({
    fullName: '',
    photoUrl: null,
    role: '',
    organization: '',
    location: '',
    description: '',
    expertise: [],
    skills: [],
    projects: [],
    experienceLevel: '',
    experience: '',
    interests: [],
    links: { website: '', x: '', linkedin: '', github: '' },
    matchmaking: emptyMatchmaking(),
});
