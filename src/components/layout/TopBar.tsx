import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { findNavItem } from '@/lib/navigation';
import BrandLogo from './BrandLogo';
import DataModeBadge from '@/components/common/DataModeBadge';
import NetworkBadge from '@/components/wallet/NetworkBadge';
import WalletButton from '@/components/wallet/WalletButton';

const TopBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
    const { pathname } = useLocation();
    const current = findNavItem(pathname);

    return (
        <header className="sticky top-0 z-20 border-b border-border bg-background">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Open navigation"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card md:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <BrandLogo compact className="md:hidden" />
                {current && (
                    <p className="hidden items-center gap-2 text-sm md:flex">
                        <span className="text-muted-foreground">Breakpoint Connect</span>
                        <span className="text-border">/</span>
                        <span className="font-medium">{current.label}</span>
                    </p>
                )}
                <div className="ml-auto flex items-center gap-2">
                    <DataModeBadge className="hidden sm:inline-flex" />
                    <NetworkBadge className="hidden sm:inline-flex" />
                    <WalletButton />
                </div>
            </div>
        </header>
    );
};

export default TopBar;
