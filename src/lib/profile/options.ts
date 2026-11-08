/**
 * Controlled vocabularies for structured profile fields.
 * Shared by the editor, the read-only views, demo data and (later) matchmaking.
 */

export const IDENTITY_OPTIONS = [
    'Founder',
    'Developer',
    'Builder',
    'Investor',
    'AI specialist',
    'Infrastructure specialist',
    'Community manager',
    'Ecosystem manager',
    'Product manager',
    'Marketer',
    'Researcher',
    'Designer',
    'Student',
] as const;
export type IdentityOption = (typeof IDENTITY_OPTIONS)[number];

/** Used for both "What I can offer" and "What I am looking for" so offers and needs line up. */
export const EXCHANGE_OPTIONS = [
    'Funding',
    'Technical advice',
    'Smart contract development',
    'Security review',
    'Hiring / talent',
    'Co-founder',
    'Partnerships & integrations',
    'Distribution & users',
    'Mentorship',
    'Design & UX',
    'Go-to-market',
    'Infrastructure & RPC',
    'Grants guidance',
    'Community growth',
    'Product feedback',
    'Introductions',
    'Fundraising advice',
    'Data & analytics',
    'AI / ML expertise',
    'Beta testers',
] as const;
export type ExchangeOption = (typeof EXCHANGE_OPTIONS)[number];

export const GOAL_OPTIONS = [
    'Raise funding',
    'Hire talent',
    'Find a co-founder',
    'Find users or customers',
    'Find partners & integrations',
    'Meet investors',
    'Showcase a product',
    'Learn about the ecosystem',
    'Find job opportunities',
    'Explore collaborations',
    'Recruit contributors',
    'Find deal flow',
] as const;
export type GoalOption = (typeof GOAL_OPTIONS)[number];

export const MEET_OPTIONS = [
    'Founders',
    'Developers & builders',
    'Investors',
    'AI & infrastructure specialists',
    'Community & ecosystem managers',
    'Product & marketing specialists',
    'Researchers',
    'Designers',
] as const;
export type MeetOption = (typeof MEET_OPTIONS)[number];

export const COLLAB_OPTIONS = [
    'Co-building',
    'Advisory',
    'Investment',
    'Integration partnership',
    'Freelance / contract',
    'Full-time role',
    'Open-source contribution',
    'Co-marketing',
    'Hackathon team',
    'Research collaboration',
] as const;
export type CollabOption = (typeof COLLAB_OPTIONS)[number];

export const TOPIC_OPTIONS = [
    'DeFi',
    'Payments',
    'Stablecoins',
    'DePIN',
    'AI agents',
    'Consumer apps',
    'Gaming',
    'Digital assets & NFTs',
    'Infrastructure & RPC',
    'Developer tooling',
    'Security',
    'Tokenomics',
    'Governance & DAOs',
    'Real-world assets',
    'Mobile',
    'Fundraising',
    'Growth & community',
    'Compliance',
] as const;
export type TopicOption = (typeof TOPIC_OPTIONS)[number];

export const EXPERIENCE_LEVELS = [
    { value: '0-2', label: '0–2 years' },
    { value: '3-5', label: '3–5 years' },
    { value: '6-10', label: '6–10 years' },
    { value: '10+', label: '10+ years' },
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]['value'];

export const experienceLabel = (value: string): string =>
    EXPERIENCE_LEVELS.find((level) => level.value === value)?.label ?? '';

export const DEMO_CATEGORIES = [
    { value: 'founder', label: 'Founders' },
    { value: 'developer', label: 'Developers & Builders' },
    { value: 'investor', label: 'Investors' },
    { value: 'ai_infra', label: 'AI & Infrastructure' },
    { value: 'community', label: 'Community & Ecosystem' },
    { value: 'product_marketing', label: 'Product & Marketing' },
] as const;
export type DemoCategory = (typeof DEMO_CATEGORIES)[number]['value'];

export const demoCategoryLabel = (value: DemoCategory): string =>
    DEMO_CATEGORIES.find((c) => c.value === value)?.label ?? value;
