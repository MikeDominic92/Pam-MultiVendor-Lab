'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaseTimerProps {
    expiresAt: Date;
    className?: string;
    showLabel?: boolean;
}

export function LeaseTimer({ expiresAt, className, showLabel = false }: LeaseTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [status, setStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const totalTime = expiresAt.getTime() - Date.now();

        const timer = setInterval(() => {
            const now = new Date();
            const diff = expiresAt.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                setStatus('critical');
                setProgress(0);
                clearInterval(timer);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            setProgress(Math.max(0, (diff / totalTime) * 100));

            if (diff < 1000 * 60 * 5) {
                setStatus('critical');
            } else if (diff < 1000 * 60 * 30) {
                setStatus('warning');
            } else {
                setStatus('healthy');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt]);

    const statusConfig = {
        healthy: {
            bg: 'bg-neon-emerald/10',
            border: 'border-neon-emerald/30',
            text: 'text-neon-emerald',
            glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
            progressBg: 'bg-neon-emerald',
        },
        warning: {
            bg: 'bg-vault-gold/10',
            border: 'border-vault-gold/30',
            text: 'text-vault-gold',
            glow: 'shadow-[0_0_10px_rgba(251,191,36,0.3)]',
            progressBg: 'bg-vault-gold',
        },
        critical: {
            bg: 'bg-plasma-pink/10',
            border: 'border-plasma-pink/30',
            text: 'text-plasma-pink',
            glow: 'shadow-[0_0_10px_rgba(236,72,153,0.3)]',
            progressBg: 'bg-plasma-pink',
        },
    };

    const config = statusConfig[status];

    return (
        <motion.div
            animate={status === 'critical' ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5, repeat: status === 'critical' ? Infinity : 0 }}
            className={cn(
                "flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-lg border backdrop-blur-sm relative overflow-hidden",
                config.bg,
                config.border,
                config.text,
                status !== 'healthy' && config.glow,
                className
            )}
        >
            {/* Progress bar background */}
            <div className="absolute inset-0 bg-black/20" />
            <motion.div
                className={cn("absolute left-0 top-0 bottom-0 opacity-20", config.progressBg)}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-2">
                <AnimatePresence mode="wait">
                    {status === 'critical' ? (
                        <motion.div
                            key="alert"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="clock"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Clock className="w-3.5 h-3.5" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {showLabel && <span className="opacity-60">TTL:</span>}
                <span className="font-bold tracking-wider">{timeLeft}</span>
            </div>
        </motion.div>
    );
}
