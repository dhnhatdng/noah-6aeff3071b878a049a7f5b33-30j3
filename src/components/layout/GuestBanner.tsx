import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';

const GuestBanner = () => {
    const { isGuest, exitGuestMode, setConnectDialogOpen } = useSession();
    const navigate = useNavigate();
    if (!isGuest) return null;

    return (
        <div className="border-b border-warning/20 bg-warning-soft">
            <div className="flex flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-10">
                <p className="flex items-center gap-2 text-warning">
                    <Eye className="h-4 w-4 shrink-0" aria-hidden />
                    <span>
                        <strong className="font-semibold">Guest demo mode.</strong> No wallet is connected and nothing is
                        saved.
                    </span>
                </p>
                <div className="flex gap-2 sm:ml-auto">
                    <Button size="sm" className="h-8 rounded-lg" onClick={() => setConnectDialogOpen(true)}>
                        Connect wallet
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-warning hover:bg-warning/10 hover:text-warning"
                        onClick={() => {
                            exitGuestMode();
                            navigate('/login');
                        }}
                    >
                        Exit demo
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GuestBanner;
