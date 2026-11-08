import { normalizeProfileData } from './normalize';
import { PROFILE_SCHEMA_VERSION, type UserProfile } from './types';

/**
 * Planned Supabase table (not created yet — Supabase is not connected):
 *
 *   public.profiles (
 *     id                 uuid primary key,
 *     owner_id           uuid references auth.users not null,
 *     full_name          text not null,
 *     photo_url          text,             -- move uploads to Supabase Storage
 *     role, organization, location, description, experience_level, experience  text,
 *     expertise, skills, interests  text[],
 *     projects           jsonb,            -- [{ id, name, summary }]
 *     links              jsonb,            -- { website, x, linkedin, github }
 *     matchmaking        jsonb,            -- MatchmakingAnswers
 *     wallet_address     text unique,
 *     wallet_provider    text,
 *     wallet_network     text,
 *     wallet_linked_at   timestamptz,
 *     wallet_verified_at timestamptz,      -- written ONLY by the server after signature verification
 *     schema_version     int,
 *     created_at, updated_at timestamptz
 *   )
 *   RLS: owners can select/update/delete their row; public read of non-sensitive columns.
 *
 * Demo profiles are bundled fixtures and must never be inserted into this table.
 */
export interface ProfileRow {
    id: string;
    owner_id: string;
    full_name: string;
    photo_url: string | null;
    role: string;
    organization: string;
    location: string;
    description: string;
    expertise: string[];
    skills: string[];
    projects: UserProfile['projects'];
    experience_level: string;
    experience: string;
    interests: string[];
    links: UserProfile['links'];
    matchmaking: UserProfile['matchmaking'];
    wallet_address: string | null;
    wallet_provider: string | null;
    wallet_network: string | null;
    wallet_linked_at: string | null;
    wallet_verified_at: string | null;
    schema_version: number;
    created_at: string;
    updated_at: string;
}

export const toProfileRow = (p: UserProfile, ownerId: string): Omit<ProfileRow, 'wallet_verified_at'> => ({
    id: p.id,
    owner_id: ownerId,
    full_name: p.fullName,
    photo_url: p.photoUrl,
    role: p.role,
    organization: p.organization,
    location: p.location,
    description: p.description,
    expertise: p.expertise,
    skills: p.skills,
    projects: p.projects,
    experience_level: p.experienceLevel,
    experience: p.experience,
    interests: p.interests,
    links: p.links,
    matchmaking: p.matchmaking,
    wallet_address: p.wallet?.address ?? null,
    wallet_provider: p.wallet?.provider ?? null,
    wallet_network: p.wallet?.network ?? null,
    wallet_linked_at: p.wallet?.linkedAt ?? null,
    schema_version: PROFILE_SCHEMA_VERSION,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
});

export const fromProfileRow = (row: ProfileRow): UserProfile => ({
    ...normalizeProfileData({
        fullName: row.full_name,
        photoUrl: row.photo_url,
        role: row.role,
        organization: row.organization,
        location: row.location,
        description: row.description,
        expertise: row.expertise,
        skills: row.skills,
        projects: row.projects,
        experienceLevel: row.experience_level,
        experience: row.experience,
        interests: row.interests,
        links: row.links,
        matchmaking: row.matchmaking,
    }),
    id: row.id,
    kind: 'user',
    schemaVersion: row.schema_version,
    wallet:
        row.wallet_address && row.wallet_provider && row.wallet_network && row.wallet_linked_at
            ? {
                  address: row.wallet_address,
                  provider: row.wallet_provider,
                  network: row.wallet_network,
                  linkedAt: row.wallet_linked_at,
              }
            : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
