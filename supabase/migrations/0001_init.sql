-- Breakpoint Connect — initial schema (0001_init)
--
-- HOW TO APPLY:
--   1. In the Supabase dashboard, open the SQL editor and run this whole file.
--   2. Then create a PUBLIC Storage bucket named `avatars` (Storage -> New bucket,
--      name `avatars`, toggle Public ON) so profile photos can be uploaded and
--      served via public URL. Bucket policies are managed in Storage settings;
--      the app uploads to `<auth-user-id>/<timestamp>-<filename>`.
--
-- AUTH MODEL: the app signs users in anonymously (supabase.auth.signInAnonymously),
-- so auth.uid() is the anonymous user id. Every row is owned by that id.
-- Anonymous sign-ins must be enabled: Dashboard -> Authentication -> Sign-in
-- providers -> Anonymous. No service-role key is used by the app.
--
-- TABLES: profiles, connections, messages, meetings, collaborations (+ members
-- and notes), event_checkins, event_sessions. All have Row Level Security on.
-- Only the two seeded event_sessions rows below carry event content; no other
-- dates, times or speakers are stored here.

-- ── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null unique references auth.users (id) on delete cascade,
    full_name text not null,
    photo_url text,
    role text not null default '',
    organization text not null default '',
    location text not null default '',
    description text not null default '',
    experience_level text not null default '',
    experience text not null default '',
    expertise text[] not null default '{}',
    skills text[] not null default '{}',
    interests text[] not null default '{}',
    projects jsonb not null default '[]'::jsonb,
    links jsonb not null default '{}'::jsonb,
    matchmaking jsonb not null default '{}'::jsonb,
    wallet_address text unique,
    wallet_provider text,
    wallet_network text,
    wallet_linked_at timestamptz,
    wallet_verified_at timestamptz,
    schema_version int not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists profiles_owner_id_idx on public.profiles (owner_id);
create index if not exists profiles_wallet_address_idx on public.profiles (wallet_address);

alter table public.profiles enable row level security;
-- Anyone (including logged-out visitors browsing Discover) can read profiles.
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
    for select using (true);
-- Only the owner can create / change / delete their own row.
drop policy if exists "profiles_owner_write" on public.profiles;
create policy "profiles_owner_write" on public.profiles
    for all using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

-- ── connections ────────────────────────────────────────────────────────────
create table if not exists public.connections (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references auth.users (id) on delete cascade,
    accepter_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (requester_id, accepter_id),
    check (requester_id <> accepter_id)
);
create index if not exists connections_requester_id_idx on public.connections (requester_id);
create index if not exists connections_accepter_id_idx on public.connections (accepter_id);

alter table public.connections enable row level security;
drop policy if exists "connections_participants_read" on public.connections;
create policy "connections_participants_read" on public.connections
    for select using (auth.uid() = requester_id or auth.uid() = accepter_id);
drop policy if exists "connections_requester_insert" on public.connections;
create policy "connections_requester_insert" on public.connections
    for insert with check (auth.uid() = requester_id);
drop policy if exists "connections_participants_update" on public.connections;
create policy "connections_participants_update" on public.connections
    for update using (auth.uid() = requester_id or auth.uid() = accepter_id)
    with check (auth.uid() = requester_id or auth.uid() = accepter_id);
drop policy if exists "connections_participants_delete" on public.connections;
create policy "connections_participants_delete" on public.connections
    for delete using (auth.uid() = requester_id or auth.uid() = accepter_id);

-- ── messages ───────────────────────────────────────────────────────────────
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null references auth.users (id) on delete cascade,
    receiver_id uuid not null references auth.users (id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now(),
    check (sender_id <> receiver_id)
);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);
create index if not exists messages_conversation_idx on public.messages (sender_id, receiver_id, created_at);

alter table public.messages enable row level security;
drop policy if exists "messages_participants_read" on public.messages;
create policy "messages_participants_read" on public.messages
    for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "messages_sender_insert" on public.messages;
create policy "messages_sender_insert" on public.messages
    for insert with check (auth.uid() = sender_id);
drop policy if exists "messages_participants_delete" on public.messages;
create policy "messages_participants_delete" on public.messages
    for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ── meetings ───────────────────────────────────────────────────────────────
create table if not exists public.meetings (
    id uuid primary key default gen_random_uuid(),
    proposer_id uuid not null references auth.users (id) on delete cascade,
    accepter_id uuid not null references auth.users (id) on delete cascade,
    start_time timestamptz not null,
    location text not null default '',
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    created_at timestamptz not null default now(),
    check (proposer_id <> accepter_id)
);
create index if not exists meetings_proposer_id_idx on public.meetings (proposer_id);
create index if not exists meetings_accepter_id_idx on public.meetings (accepter_id);

alter table public.meetings enable row level security;
drop policy if exists "meetings_participants_read" on public.meetings;
create policy "meetings_participants_read" on public.meetings
    for select using (auth.uid() = proposer_id or auth.uid() = accepter_id);
drop policy if exists "meetings_proposer_insert" on public.meetings;
create policy "meetings_proposer_insert" on public.meetings
    for insert with check (auth.uid() = proposer_id);
drop policy if exists "meetings_participants_update" on public.meetings;
create policy "meetings_participants_update" on public.meetings
    for update using (auth.uid() = proposer_id or auth.uid() = accepter_id)
    with check (auth.uid() = proposer_id or auth.uid() = accepter_id);
drop policy if exists "meetings_participants_delete" on public.meetings;
create policy "meetings_participants_delete" on public.meetings
    for delete using (auth.uid() = proposer_id or auth.uid() = accepter_id);

-- ── collaborations ─────────────────────────────────────────────────────────
create table if not exists public.collaborations (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    description text not null default '',
    created_at timestamptz not null default now()
);
create index if not exists collaborations_owner_id_idx on public.collaborations (owner_id);

alter table public.collaborations enable row level security;
drop policy if exists "collaborations_members_read" on public.collaborations;
create policy "collaborations_members_read" on public.collaborations
    for select using (
        auth.uid() = owner_id
        or exists (
            select 1 from public.collaboration_members m
            where m.collaboration_id = collaborations.id and m.user_id = auth.uid()
        )
    );
drop policy if exists "collaborations_owner_insert" on public.collaborations;
create policy "collaborations_owner_insert" on public.collaborations
    for insert with check (auth.uid() = owner_id);
drop policy if exists "collaborations_owner_write" on public.collaborations;
create policy "collaborations_owner_write" on public.collaborations
    for update using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);
drop policy if exists "collaborations_owner_delete" on public.collaborations;
create policy "collaborations_owner_delete" on public.collaborations
    for delete using (auth.uid() = owner_id);

create table if not exists public.collaboration_members (
    collaboration_id uuid not null references public.collaborations (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    primary key (collaboration_id, user_id)
);
create index if not exists collaboration_members_user_id_idx on public.collaboration_members (user_id);

alter table public.collaboration_members enable row level security;
drop policy if exists "collaboration_members_read" on public.collaboration_members;
create policy "collaboration_members_read" on public.collaboration_members
    for select using (
        auth.uid() = user_id
        or exists (
            select 1 from public.collaborations c
            where c.id = collaboration_members.collaboration_id and c.owner_id = auth.uid()
        )
    );
drop policy if exists "collaboration_members_insert" on public.collaboration_members;
create policy "collaboration_members_insert" on public.collaboration_members
    for insert with check (
        auth.uid() = user_id
        or exists (
            select 1 from public.collaborations c
            where c.id = collaboration_members.collaboration_id and c.owner_id = auth.uid()
        )
    );
drop policy if exists "collaboration_members_delete" on public.collaboration_members;
create policy "collaboration_members_delete" on public.collaboration_members
    for delete using (
        auth.uid() = user_id
        or exists (
            select 1 from public.collaborations c
            where c.id = collaboration_members.collaboration_id and c.owner_id = auth.uid()
        )
    );

create table if not exists public.collaboration_notes (
    id uuid primary key default gen_random_uuid(),
    collaboration_id uuid not null references public.collaborations (id) on delete cascade,
    author_id uuid not null references auth.users (id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
);
create index if not exists collaboration_notes_collaboration_id_idx on public.collaboration_notes (collaboration_id);

alter table public.collaboration_notes enable row level security;
drop policy if exists "collaboration_notes_members_read" on public.collaboration_notes;
create policy "collaboration_notes_members_read" on public.collaboration_notes
    for select using (
        exists (
            select 1 from public.collaborations c
            where c.id = collaboration_notes.collaboration_id
            and (
                c.owner_id = auth.uid()
                or exists (
                    select 1 from public.collaboration_members m
                    where m.collaboration_id = c.id and m.user_id = auth.uid()
                )
            )
        )
    );
drop policy if exists "collaboration_notes_author_insert" on public.collaboration_notes;
create policy "collaboration_notes_author_insert" on public.collaboration_notes
    for insert with check (
        auth.uid() = author_id
        and exists (
            select 1 from public.collaborations c
            where c.id = collaboration_notes.collaboration_id
            and (
                c.owner_id = auth.uid()
                or exists (
                    select 1 from public.collaboration_members m
                    where m.collaboration_id = c.id and m.user_id = auth.uid()
                )
            )
        )
    );
drop policy if exists "collaboration_notes_author_delete" on public.collaboration_notes;
create policy "collaboration_notes_author_delete" on public.collaboration_notes
    for delete using (auth.uid() = author_id);

-- ── event_checkins ─────────────────────────────────────────────────────────
create table if not exists public.event_checkins (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users (id) on delete cascade,
    wallet_address text,
    checked_in_at timestamptz not null default now()
);
create index if not exists event_checkins_user_id_idx on public.event_checkins (user_id);

alter table public.event_checkins enable row level security;
-- Anyone can count check-ins; only the row owner can create/remove their own.
drop policy if exists "event_checkins_public_read" on public.event_checkins;
create policy "event_checkins_public_read" on public.event_checkins
    for select using (true);
drop policy if exists "event_checkins_own_insert" on public.event_checkins;
create policy "event_checkins_own_insert" on public.event_checkins
    for insert with check (auth.uid() = user_id);
drop policy if exists "event_checkins_own_delete" on public.event_checkins;
create policy "event_checkins_own_delete" on public.event_checkins
    for delete using (auth.uid() = user_id);

-- ── Storage policies for the `avatars` bucket ────────────────────────────
-- Create the bucket itself in the dashboard (Storage -> New bucket, name
-- `avatars`, Public ON). A public bucket still enforces RLS on
-- storage.objects, so without these policies photo uploads fail with an
-- RLS violation. The app uploads to `<auth-user-id>/<file>`, so each user
-- can only write inside their own folder; anyone can read (public URLs).
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
    for select using (bucket_id = 'avatars');
drop policy if exists "avatars_owner_upload" on storage.objects;
create policy "avatars_owner_upload" on storage.objects
    for insert with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
    for update using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
    for delete using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- ── event_sessions (program themes only — no times or speakers) ────────────
create table if not exists public.event_sessions (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    day int not null,
    theme text,
    description text
);
create index if not exists event_sessions_day_idx on public.event_sessions (day);

alter table public.event_sessions enable row level security;
drop policy if exists "event_sessions_public_read" on public.event_sessions;
create policy "event_sessions_public_read" on public.event_sessions
    for select using (true);
-- No write policy: sessions are managed from the Supabase dashboard only.

-- Seed: the only two verified program-theme rows. Day 2 has no separately
-- verified title, so its published theme text is used as the title as well.
-- No times, speakers or other sessions are invented here.
-- Fixed ids make re-running this file a no-op for the seed rows.
insert into public.event_sessions (id, title, day, theme, description) values
    ('11111111-1111-1111-1111-111111111101', 'The Supercycle Today', 1, 'Stablecoins and payments', null),
    ('11111111-1111-1111-1111-111111111102', 'AI agents and consumer apps', 2, 'AI agents and consumer apps', null)
on conflict (id) do nothing;
