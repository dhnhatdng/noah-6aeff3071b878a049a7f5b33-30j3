import { Link } from 'react-router-dom';
import { Handshake, Inbox, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';

const tabTrigger =
    'rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card';

const Connections = () => (
    <div className="flex flex-col gap-8">
        <PageHeader
            eyebrow="Connections"
            title="Your network"
            description="Everyone you’ve connected with, plus requests waiting on you or them."
        />

        <SurfaceCard>
            <Tabs defaultValue="all" className="flex flex-col gap-5">
                <TabsList className="h-auto self-start rounded-xl bg-secondary p-1">
                    <TabsTrigger value="all" className={tabTrigger}>Connected</TabsTrigger>
                    <TabsTrigger value="received" className={tabTrigger}>Received</TabsTrigger>
                    <TabsTrigger value="sent" className={tabTrigger}>Sent</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                    <EmptyState
                        icon={Handshake}
                        title="No connections yet"
                        description="When someone accepts your request, they’ll appear here."
                        action={
                            <Button asChild size="sm" className="rounded-lg">
                                <Link to="/discover">Discover people</Link>
                            </Button>
                        }
                    />
                </TabsContent>
                <TabsContent value="received" className="mt-0">
                    <EmptyState icon={Inbox} title="No requests received" description="Incoming connection requests will show here." />
                </TabsContent>
                <TabsContent value="sent" className="mt-0">
                    <EmptyState icon={Send} title="No requests sent" description="Requests you send will be tracked here." />
                </TabsContent>
            </Tabs>
        </SurfaceCard>
    </div>
);

export default Connections;
