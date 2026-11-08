import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
    <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
        <div className="max-w-2xl">
            {eyebrow && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">{eyebrow}</p>
            )}
            <h1 className="text-3xl font-semibold leading-[1.1] sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </motion.header>
);

export default PageHeader;
