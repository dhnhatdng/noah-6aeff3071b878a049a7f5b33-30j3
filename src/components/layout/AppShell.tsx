import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppSidebar from './AppSidebar';
import TopBar from './TopBar';
import MobileNavSheet from './MobileNavSheet';
import MobileTabBar from './MobileTabBar';
import GuestBanner from './GuestBanner';
import WalletConnectDialog from '@/components/wallet/WalletConnectDialog';

const AppShell = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { pathname } = useLocation();

    return (
        <div className="min-h-screen">
            <AppSidebar />
            <div className="md:pl-[76px] lg:pl-64">
                <TopBar onOpenMenu={() => setMenuOpen(true)} />
                <GuestBanner />
                <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-10 lg:pt-10">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
            <MobileTabBar onOpenMenu={() => setMenuOpen(true)} />
            <MobileNavSheet open={menuOpen} onOpenChange={setMenuOpen} />
            <WalletConnectDialog />
        </div>
    );
};

export default AppShell;
