import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/layout/BrandLogo';

const NotFound = () => {
    const location = useLocation();

    useEffect(() => {
        console.error('404 Error: User attempted to access non-existent route:', location.pathname);
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
            <BrandLogo />
            <h1 className="text-6xl font-semibold">404</h1>
            <p className="text-muted-foreground">This page doesn’t exist.</p>
            <Button asChild className="rounded-xl">
                <Link to="/">Back to Overview</Link>
            </Button>
        </div>
    );
};

export default NotFound;
