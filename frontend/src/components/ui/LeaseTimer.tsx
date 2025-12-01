'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaseTimerProps {
    expiresAt: Date;
    className?: string;
}

export function LeaseTimer({ expiresAt, className }: LeaseTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [status, setStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = expiresAt.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                setStatus('critical');
                clearInterval(timer);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

            if (diff < 1000 * 60 * 5) { // Less than 5 mins
                setStatus('critical');
            } else if (diff < 1000 * 60 * 30) { // Less than 30 mins
                setStatus('warning');
            } else {
                setStatus('healthy');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    return (
        <div className={cn(
            "flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-full border bg-black/20 backdrop-blur-sm",
            status === 'healthy' && "border-emerald-500/30 text-emerald-400",
            status === 'warning' && "border-amber-500/30 text-amber-400 animate-pulse",
            status === 'critical' && "border-ruby-danger/30 text-ruby-danger animate-pulse",
            className
        )}>
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}</span>
        </div>
    );
}
