'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    glow?: boolean;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
}

export function GlassButton({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    glow = false,
    className,
    disabled,
    onClick,
    type = 'button',
}: GlassButtonProps) {
    const variants = {
        primary: {
            base: 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 hover:border-cyber-cyan/50',
            glow: 'shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.4)]',
        },
        secondary: {
            base: 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20 hover:border-cyber-purple/50',
            glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]',
        },
        ghost: {
            base: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white',
            glow: '',
        },
        danger: {
            base: 'bg-plasma-pink/10 border-plasma-pink/30 text-plasma-pink hover:bg-plasma-pink/20 hover:border-plasma-pink/50',
            glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]',
        },
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2.5 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
    };

    const variantStyles = variants[variant];

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(
                "inline-flex items-center justify-center font-medium rounded-xl border backdrop-blur-sm transition-all duration-300",
                variantStyles.base,
                glow && variantStyles.glow,
                sizes[size],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            disabled={disabled || loading}
            onClick={onClick}
            type={type}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
                    <span>{children}</span>
                    {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
                </>
            )}
        </motion.button>
    );
}
