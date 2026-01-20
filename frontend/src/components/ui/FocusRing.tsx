'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FocusRingProps {
    children: React.ReactNode;
    className?: string;
    color?: 'cyan' | 'purple' | 'emerald' | 'gold' | 'pink';
    as?: 'div' | 'button' | 'a';
    disabled?: boolean;
}

const colorClasses = {
    cyan: {
        ring: 'focus-within:ring-cyber-cyan/30 focus-within:border-cyber-cyan/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(0,245,255,0.2)]',
    },
    purple: {
        ring: 'focus-within:ring-cyber-purple/30 focus-within:border-cyber-purple/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    },
    emerald: {
        ring: 'focus-within:ring-neon-emerald/30 focus-within:border-neon-emerald/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
    gold: {
        ring: 'focus-within:ring-vault-gold/30 focus-within:border-vault-gold/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    },
    pink: {
        ring: 'focus-within:ring-plasma-pink/30 focus-within:border-plasma-pink/50',
        glow: 'focus-within:shadow-[0_0_20px_rgba(236,72,153,0.2)]',
    },
};

export function FocusRing({
    children,
    className,
    color = 'cyan',
    as: Component = 'div',
    disabled,
}: FocusRingProps) {
    const colors = colorClasses[color];

    return (
        <Component
            className={cn(
                "relative outline-none ring-2 ring-transparent border border-transparent transition-all duration-200",
                !disabled && colors.ring,
                !disabled && colors.glow,
                className
            )}
        >
            {children}
        </Component>
    );
}

// Animated click ripple effect
interface RippleProps {
    color?: string;
}

export function useRipple(color: string = 'rgba(0, 245, 255, 0.3)') {
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

    const addRipple = (event: React.MouseEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const id = Date.now();

        setRipples((prev) => [...prev, { x, y, id }]);

        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
    };

    const RippleContainer = () => (
        <>
            {ripples.map((ripple) => (
                <motion.span
                    key={ripple.id}
                    className="absolute pointer-events-none rounded-full"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        backgroundColor: color,
                    }}
                    initial={{ width: 0, height: 0, opacity: 0.5, x: 0, y: 0 }}
                    animate={{
                        width: 200,
                        height: 200,
                        opacity: 0,
                        x: -100,
                        y: -100,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            ))}
        </>
    );

    return { addRipple, RippleContainer };
}

// Magnetic hover effect
interface MagneticProps {
    children: React.ReactNode;
    strength?: number;
    className?: string;
}

export function Magnetic({ children, strength = 0.3, className }: MagneticProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = (e.clientX - centerX) * strength;
        const y = (e.clientY - centerY) * strength;

        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        >
            {children}
        </motion.div>
    );
}

// Tilt card effect
interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxTilt?: number;
    perspective?: number;
    glare?: boolean;
}

export function TiltCard({
    children,
    className,
    maxTilt = 10,
    perspective = 1000,
    glare = true,
}: TiltCardProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [transform, setTransform] = React.useState({ rotateX: 0, rotateY: 0 });
    const [glarePosition, setGlarePosition] = React.useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        setTransform({ rotateX, rotateY });
        setGlarePosition({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
        });
    };

    const handleMouseLeave = () => {
        setTransform({ rotateX: 0, rotateY: 0 });
        setGlarePosition({ x: 50, y: 50 });
    };

    return (
        <motion.div
            ref={ref}
            className={cn("relative overflow-hidden", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{
                rotateX: transform.rotateX,
                rotateY: transform.rotateY,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ perspective }}
        >
            {children}
            {glare && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
                    style={{
                        background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                    }}
                />
            )}
        </motion.div>
    );
}

// Pulse animation wrapper
interface PulseProps {
    children: React.ReactNode;
    className?: string;
    color?: 'cyan' | 'purple' | 'emerald' | 'gold' | 'pink';
    active?: boolean;
}

const pulseColors = {
    cyan: '#00f5ff',
    purple: '#a855f7',
    emerald: '#10b981',
    gold: '#fbbf24',
    pink: '#ec4899',
};

export function Pulse({ children, className, color = 'cyan', active = true }: PulseProps) {
    const pulseColor = pulseColors[color];

    return (
        <div className={cn("relative", className)}>
            {children}
            {active && (
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: `2px solid ${pulseColor}` }}
                    animate={{
                        scale: [1, 1.5, 1.5],
                        opacity: [0.5, 0.2, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            )}
        </div>
    );
}
