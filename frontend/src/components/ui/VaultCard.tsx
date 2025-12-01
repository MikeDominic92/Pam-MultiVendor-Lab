import React from 'react';
import { cn } from '@/lib/utils';

interface VaultCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title?: string;
    icon?: React.ElementType;
    className?: string;
}

export function VaultCard({ children, title, icon: Icon, className, ...props }: VaultCardProps) {
    return (
        <div
            className={cn(
                "glass-panel rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-vault-gold/30",
                className
            )}
            {...props}
        >
            {/* Golden Corner Accent */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-vault-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute top-0 right-0 w-px h-8 bg-gradient-to-b from-vault-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 h-px w-8 bg-gradient-to-l from-vault-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {(title || Icon) && (
                <div className="flex items-center gap-3 mb-4">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-vault-surface border border-white/5 group-hover:border-vault-gold/20 transition-colors">
                            <Icon className="w-5 h-5 text-vault-gold" />
                        </div>
                    )}
                    {title && (
                        <h3 className="text-lg font-bold text-ghost-white tracking-tight">{title}</h3>
                    )}
                </div>
            )}

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
