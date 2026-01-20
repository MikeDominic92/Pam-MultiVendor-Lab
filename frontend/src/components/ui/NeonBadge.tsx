'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NeonBadgeProps {
    children: React.ReactNode;
    variant?: 'cyan' | 'purple' | 'emerald' | 'gold' | 'pink' | 'gray';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    glow?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

export function NeonBadge({
    children,
    variant = 'cyan',
    size = 'sm',
    pulse = false,
    glow = false,
    icon,
    className,
}: NeonBadgeProps) {
    const variants = {
        cyan: {
            bg: 'bg-cyber-cyan/10',
            border: 'border-cyber-cyan/30',
            text: 'text-cyber-cyan',
            glow: 'shadow-[0_0_10px_rgba(0,245,255,0.4)]',
            dot: 'bg-cyber-cyan',
        },
        purple: {
            bg: 'bg-cyber-purple/10',
            border: 'border-cyber-purple/30',
            text: 'text-cyber-purple',
            glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]',
            dot: 'bg-cyber-purple',
        },
        emerald: {
            bg: 'bg-neon-emerald/10',
            border: 'border-neon-emerald/30',
            text: 'text-neon-emerald',
            glow: 'shadow-[0_0_10px_rgba(16,185,129,0.4)]',
            dot: 'bg-neon-emerald',
        },
        gold: {
            bg: 'bg-vault-gold/10',
            border: 'border-vault-gold/30',
            text: 'text-vault-gold',
            glow: 'shadow-[0_0_10px_rgba(251,191,36,0.4)]',
            dot: 'bg-vault-gold',
        },
        pink: {
            bg: 'bg-plasma-pink/10',
            border: 'border-plasma-pink/30',
            text: 'text-plasma-pink',
            glow: 'shadow-[0_0_10px_rgba(236,72,153,0.4)]',
            dot: 'bg-plasma-pink',
        },
        gray: {
            bg: 'bg-gray-500/10',
            border: 'border-gray-500/30',
            text: 'text-gray-400',
            glow: '',
            dot: 'bg-gray-500',
        },
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const variantStyles = variants[variant];

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1.5 font-mono uppercase tracking-wider border rounded-lg backdrop-blur-sm",
                variantStyles.bg,
                variantStyles.border,
                variantStyles.text,
                glow && variantStyles.glow,
                sizes[size],
                className
            )}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {pulse && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        variantStyles.dot
                    )} />
                    <span className={cn(
                        "relative inline-flex rounded-full h-1.5 w-1.5",
                        variantStyles.dot
                    )} />
                </span>
            )}
            <span className="font-medium">{children}</span>
        </motion.span>
    );
}
