import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AppModal from '@/components/common/AppModal';
import { useSession } from '@/hooks/useSession';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import WalletOptionList from './WalletOptionList';
import SecurityNote from './SecurityNote';
import AddressDisplay from './AddressDisplay';
import NetworkBadge from './NetworkBadge';

const WalletConnectDialog = () => {
    const { connectDialogOpen, setConnectDialogOpen } = useSession();
    const { connected, address, walletName } = useWalletConnect();
    const close = () => setConnectDialogOpen(false);

    if (connected && address) {
        return (
            <AppModal
                open={connectDialogOpen}
                onOpenChange={setConnectDialogOpen}
                title="Wallet connected"
                footer={
                    <>
                        <Button variant="outline" className="rounded-xl" asChild onClick={close}>
                            <Link to="/settings">Verify ownership</Link>
                        </Button>
                        <Button className="rounded-xl" onClick={close}>
                            Done
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 rounded-xl bg-success-soft px-4 py-3 text-success">
                        <CheckCircle2 className="h-5 w-5" aria-hidden />
                        <p className="text-sm font-medium">Connected to {walletName}</p>
                    </div>
                    <AddressDisplay address={address} />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        A connection shares your public address only. Proving ownership requires signing a one-time
                        message, available in Settings.
                    </p>
                </div>
            </AppModal>
        );
    }

    return (
        <AppModal
            open={connectDialogOpen}
            onOpenChange={setConnectDialogOpen}
            title="Connect a wallet"
            description="Choose a Solana wallet. You’ll approve the connection inside the wallet."
        >
            <div className="flex flex-col gap-5">
                <WalletOptionList />
                <div className="flex items-center justify-between gap-3">
                    <SecurityNote />
                    <NetworkBadge className="shrink-0" />
                </div>
            </div>
        </AppModal>
    );
};

export default WalletConnectDialog;
