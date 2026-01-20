'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface VaultCardProps {
    children: React.ReactNode;
    title?: string;
    icon?: React.ElementType;
    className?: string;
    variant?: 'default' | 'elevated' | 'outlined';
    accentColor?: 'cyan' | 'purple' | 'emerald' | 'gold' | 'pink';
}

export function VaultCard({
    children,
    title,
    icon: Icon,
    className,
    variant = 'default',
    accentColor = 'cyan',
}: VaultCardProps) {
    const accentColors = {
        cyan: {
            bg: 'bg-cyber-cyan/10',
            text: 'text-cyber-cyan',
            border: 'border-cyber-cyan/20',
            glow: 'from-cyber-cyan/10',
            shadow: 'shadow-cyber-cyan/20',
        },
        purple: {
            bg: 'bg-cyber-purple/10',
            text: 'text-cyber-purple',
            border: 'border-cyber-purple/20',
            glow: 'from-cyber-purple/10',
            shadow: 'shadow-cyber-purple/20',
        },
        emerald: {
            bg: 'bg-neon-emerald/10',
            text: 'text-neon-emerald',
            border: 'border-neon-emerald/20',
            glow: 'from-neon-emerald/10',
            shadow: 'shadow-neon-emerald/20',
        },
        gold: {
            bg: 'bg-vault-gold/10',
            text: 'text-vault-gold',
            border: 'border-vault-gold/20',
            glow: 'from-vault-gold/10',
            shadow: 'shadow-vault-gold/20',
        },
        pink: {
            bg: 'bg-plasma-pink/10',
            text: 'text-plasma-pink',
            border: 'border-plasma-pink/20',
            glow: 'from-plasma-pink/10',
            shadow: 'shadow-plasma-pink/20',
        },
    };

    const accent = accentColors[accentColor];

    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "glass-card rounded-2xl p-6 relative overflow-hidden group",
                variant === 'elevated' && "shadow-lg shadow-black/20",
                variant === 'outlined' && "bg-transparent border-2",
                className
            )}
        >
            {/* Corner accent glow */}
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-tr-2xl",
                accent.glow
            )} />

            {/* Animated corner lines */}
            <div className={cn(
                "absolute top-0 right-0 w-px h-12 bg-gradient-to-b to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500",
                accent.text.replace('text-', 'from-')
            )} />
            <div className={cn(
                "absolute top-0 right-0 h-px w-12 bg-gradient-to-l to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500",
                accent.text.replace('text-', 'from-')
            )} />

            {/* Header */}
            {(title || Icon) && (
                <div className="flex items-center gap-3 mb-5">
                    {Icon && (
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                            accent.bg,
                            accent.border,
                            "group-hover:shadow-lg",
                            accent.shadow
                        )}>
                            <Icon className={cn("w-5 h-5", accent.text)} />
                        </div>
                    )}
                    {title && (
                        <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
