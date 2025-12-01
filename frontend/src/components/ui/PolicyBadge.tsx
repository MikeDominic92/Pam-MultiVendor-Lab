import React from 'react';
import { cn } from '@/lib/utils';

interface PolicyBadgeProps {
    capability: 'read' | 'create' | 'update' | 'delete' | 'list' | 'sudo' | 'deny';
    className?: string;
}

export function PolicyBadge({ capability, className }: PolicyBadgeProps) {
    const styles = {
        read: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        create: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        update: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        delete: 'bg-red-500/10 text-red-400 border-red-500/20',
        list: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        sudo: 'bg-vault-gold/10 text-vault-gold border-vault-gold/20',
        deny: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border",
            styles[capability],
            className
        )}>
            {capability}
        </span>
    );
}
