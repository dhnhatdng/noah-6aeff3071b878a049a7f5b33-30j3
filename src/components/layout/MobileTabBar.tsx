import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const tabClass = 'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors';

const MobileTabBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => (
    <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Quick navigation"
    >
        <ul className="flex">
            {NAV_ITEMS.filter((item) => item.mobileTab).map((item) => (
                <li key={item.key} className="flex flex-1">
                    <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => cn(tabClass, isActive ? 'text-foreground' : 'text-muted-foreground')}
                    >
                        {({ isActive }) => (
                            <>
                                <span
                                    className={cn(
                                        'grid h-7 w-12 place-items-center rounded-full transition-colors',
                                        isActive && 'bg-primary',
                                    )}
                                >
                                    <item.icon className="h-[18px] w-[18px]" aria-hidden />
                                </span>
                                {item.label.split(' ')[item.key === 'matchmaking' ? 1 : 0]}
                            </>
                        )}
                    </NavLink>
                </li>
            ))}
            <li className="flex flex-1">
                <button type="button" onClick={onOpenMenu} className={cn(tabClass, 'text-muted-foreground')}>
                    <span className="grid h-7 w-12 place-items-center rounded-full">
                        <Menu className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    More
                </button>
            </li>
        </ul>
    </nav>
);

export default MobileTabBar;
