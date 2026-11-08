import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import SolanaProviders from '@/components/providers/SolanaProviders';
import ProfileProvider from '@/components/providers/ProfileProvider';
import RequireSession from '@/components/auth/RequireSession';
import AppShell from '@/components/layout/AppShell';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Matchmaking from './pages/Matchmaking';
import Discover from './pages/Discover';
import LiveEvent from './pages/LiveEvent';
import Connections from './pages/Connections';
import Collaboration from './pages/Collaboration';
import Settings from './pages/Settings';

const App = () => (
    <SolanaProviders>
        <ProfileProvider>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireSession />}>
                <Route element={<AppShell />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/matchmaking" element={<Matchmaking />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/live" element={<LiveEvent />} />
                    <Route path="/connections" element={<Connections />} />
                    <Route path="/collaboration" element={<Collaboration />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
        </ProfileProvider>
        <Toaster />
    </SolanaProviders>
);

export default App;
