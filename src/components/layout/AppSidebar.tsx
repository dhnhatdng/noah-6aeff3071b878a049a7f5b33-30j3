import { Link, NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import BrandLogo from './BrandLogo';
import SidebarWalletPanel from './SidebarWalletPanel';

/** Tablet: 76px icon rail. Desktop: 256px full sidebar. Hidden on mobile. */
const AppSidebar = () => (
    <aside className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card md:flex md:w-[76px] lg:w-64">
        <div className="flex h-16 items-center justify-center border-b border-border px-4 lg:justify-start lg:px-5">
            <BrandLogo compact className="lg:hidden" />
            <BrandLogo className="hidden lg:flex" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
            <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:block">
                Navigate
            </p>
            <ul className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                    <li key={item.key}>
                        <NavLink
                            to={item.path}
                            end={item.path === '/'}
                            title={item.label}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-standard md:justify-center lg:justify-start',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-card'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                )
                            }
                        >
                            <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                            <span className="md:sr-only lg:not-sr-only">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-3">
            <SidebarWalletPanel />
            <Link
                to="/privacy"
                className="hidden px-1 text-center text-xs text-muted-foreground hover:text-foreground hover:underline lg:block lg:text-left"
            >
                Privacy Policy
            </Link>
        </div>
    </aside>
);

export default AppSidebar;
