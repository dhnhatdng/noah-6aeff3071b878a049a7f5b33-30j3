import { Link, NavLink } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import BrandLogo from './BrandLogo';
import SidebarWalletPanel from './SidebarWalletPanel';
import SignOutButton from './SignOutButton';
import NetworkBadge from '@/components/wallet/NetworkBadge';

interface MobileNavSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MobileNavSheet = ({ open, onOpenChange }: MobileNavSheetProps) => (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="flex w-[300px] flex-col gap-0 border-border bg-card p-0">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle asChild>
                    <div>
                        <BrandLogo />
                    </div>
                </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
                <ul className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.key}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/'}
                                onClick={() => onOpenChange(false)}
                                className={({ isActive }) =>
                                    cn(
                                        'flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 transition-colors',
                                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                                        <span>
                                            <span className="block text-sm font-medium">{item.label}</span>
                                            <span
                                                className={cn(
                                                    'block text-xs',
                                                    isActive ? 'text-primary-foreground/75' : 'text-muted-foreground',
                                                )}
                                            >
                                                {item.description}
                                            </span>
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="flex flex-col gap-3 border-t border-border p-4">
                <NetworkBadge className="self-start" />
                <SidebarWalletPanel expanded />
                <SignOutButton className="w-full" />
                <Link to="/privacy" onClick={() => onOpenChange(false)} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                    Privacy Policy
                </Link>
            </div>
        </SheetContent>
    </Sheet>
);

export default MobileNavSheet;
