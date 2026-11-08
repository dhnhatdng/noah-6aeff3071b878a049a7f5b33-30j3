import type { ReactNode } from 'react';
import { experienceLabel } from '@/lib/profile/options';
import type { ProfileData } from '@/lib/profile/types';
import ChipList from './ChipList';

const Block = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</h3>
        {children}
    </div>
);

const ProfileAboutSection = ({ profile }: { profile: ProfileData }) => (
    <div className="flex flex-col gap-6">
        <Block label="Professional description">
            <p className="whitespace-pre-line text-[15px] leading-relaxed">
                {profile.description || <span className="text-muted-foreground">No description yet.</span>}
            </p>
        </Block>
        <div className="grid gap-6 sm:grid-cols-2">
            <Block label="Expertise">
                <ChipList items={profile.expertise} tone="sage" />
            </Block>
            <Block label="Skills">
                <ChipList items={profile.skills} />
            </Block>
        </div>
        <Block label="Current projects">
            {profile.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not added</p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                    {profile.projects.map((p) => (
                        <li key={p.id} className="rounded-xl border border-border bg-background p-4">
                            <p className="font-medium">{p.name}</p>
                            {p.summary && <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </Block>
        <div className="grid gap-6 sm:grid-cols-2">
            <Block label="Experience">
                {profile.experienceLevel || profile.experience ? (
                    <div className="flex flex-col gap-1">
                        {profile.experienceLevel && (
                            <p className="text-sm font-medium">{experienceLabel(profile.experienceLevel)}</p>
                        )}
                        {profile.experience && <p className="text-sm text-muted-foreground">{profile.experience}</p>}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Not added</p>
                )}
            </Block>
            <Block label="Interests">
                <ChipList items={profile.interests} />
            </Block>
        </div>
    </div>
);

export default ProfileAboutSection;
