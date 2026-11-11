import { Link } from 'react-router-dom';
import BrandLogo from '@/components/layout/BrandLogo';

/**
 * Public privacy policy. This page must stay reachable without signing in:
 * Google requires a public privacy-policy URL to publish the app's OAuth
 * consent screen. Every claim below is grounded in the code — see the
 * Supabase repositories (src/lib/supabase/*), the profile types
 * (src/lib/profile/types.ts) and the row-level-security policies in
 * supabase/migrations/0001_init.sql. Do not add claims about data the app
 * does not actually collect.
 */
const Privacy = () => (
    <div className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-10">
        <div className="mx-auto w-full max-w-2xl">
            <header className="flex items-center justify-between gap-4">
                <BrandLogo />
                <Link to="/login" className="text-sm font-medium text-primary-strong hover:underline">
                    Back to sign in
                </Link>
            </header>

            <main className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10">
                <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">Privacy Policy</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: November 2026</p>

                <p className="mt-6 leading-relaxed">
                    Breakpoint Connect is a networking app for attendees of Solana Breakpoint 2026 (November 15–17,
                    Olympia London). It helps people at the event find each other, get introduced, message, meet and
                    collaborate. This policy explains what data the app collects, why, who can see it, and how to
                    remove it.
                </p>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">1. Data we collect</h2>
                    <p className="mt-3 leading-relaxed">
                        <strong>Your account.</strong> When you connect a Solana wallet (for example Phantom or
                        Solflare), we receive your wallet&apos;s public address, which wallet you used, and which
                        network it is on. When you sign in with Google, Google shares your name and email address
                        with our authentication provider (Supabase) so it can create your account. The app does not
                        show your email address to other attendees.
                    </p>
                    <p className="mt-3 leading-relaxed">
                        <strong>Your profile.</strong> Only what you choose to enter: your name, profile photo, role,
                        organization, location, description, skills, expertise, interests, projects, experience, and
                        links (website, X, LinkedIn, GitHub), plus your matchmaking answers. Your photo is stored as
                        a file in our storage service.
                    </p>
                    <p className="mt-3 leading-relaxed">
                        <strong>Things you create in the app.</strong> Connection requests, messages you send, meetings
                        you propose or accept, collaboration notes, and event check-ins.
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">2. Data we never collect</h2>
                    <p className="mt-3 leading-relaxed">
                        We never ask for your seed phrase or private key, and we never receive them. Connecting a
                        wallet shares only your public address. The app does not run advertising or analytics trackers.
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">3. How we use your data</h2>
                    <p className="mt-3 leading-relaxed">
                        Only to run the app: to show your profile to other attendees, to suggest introductions, and to
                        let you message, meet and collaborate with people at Breakpoint. We do not sell your data and
                        we do not use it for advertising.
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">4. Who can see your data</h2>
                    <p className="mt-3 leading-relaxed">
                        Your profile is visible to other attendees using Breakpoint Connect — that is the purpose of
                        the app, so only put in your profile what you are happy for other attendees to see. Your
                        messages are visible only to the people in the conversation, and your meetings and
                        collaborations only to their participants.
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">5. Where your data is stored</h2>
                    <p className="mt-3 leading-relaxed">
                        Your data is stored with Supabase (our database and file storage for profile photos), and the
                        app is hosted on Vercel.
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">6. Deleting your data</h2>
                    <p className="mt-3 leading-relaxed">
                        In Settings you can delete your profile. That permanently removes your profile — including
                        your matchmaking answers and your linked wallet — from the database. It does not automatically
                        delete messages, meetings, connections, collaboration notes or check-ins you already created,
                        or the copy of your profile photo already uploaded. If you want those removed as well, email us
                        (see Contact below) and we will delete them.
                    </p>
                    <p className="mt-3 leading-relaxed">
                        In guest demo mode, your data stays in your browser only and is never sent to our servers.
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">7. Contact</h2>
                    <p className="mt-3 leading-relaxed">
                        Questions about this policy, or a request to delete your data:{' '}
                        <a href="mailto:dhnhat.dng@gmail.com" className="font-medium text-primary-strong hover:underline">
                            dhnhat.dng@gmail.com
                        </a>
                    </p>
                </section>

                <section className="mt-8">
                    <h2 className="font-display text-xl font-semibold">8. Changes to this policy</h2>
                    <p className="mt-3 leading-relaxed">
                        We may update this policy as the app changes. The date at the top shows the latest version.
                    </p>
                </section>
            </main>

            <footer className="mt-6 text-center text-xs text-muted-foreground">
                <Link to="/login" className="hover:underline">
                    Breakpoint Connect
                </Link>{' '}
                · Solana Breakpoint 2026
            </footer>
        </div>
    </div>
);

export default Privacy;
