import { useCallback, useState } from 'react';
import { toast } from './use-toast';

export const useCopyToClipboard = (timeout = 1600) => {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(
        async (text: string, label = 'Copied to clipboard') => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                toast({ title: label });
                window.setTimeout(() => setCopied(false), timeout);
            } catch {
                toast({
                    title: 'Copy failed',
                    description: 'Your browser blocked clipboard access.',
                    variant: 'destructive',
                });
            }
        },
        [timeout],
    );

    return { copied, copy };
};
