'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    formatOptions?: Intl.NumberFormatOptions;
}

export function AnimatedCounter({
    value,
    duration = 1,
    className,
    prefix = '',
    suffix = '',
    decimals = 0,
    formatOptions,
}: AnimatedCounterProps) {
    const spring = useSpring(0, { duration: duration * 1000 });
    const display = useTransform(spring, (current) => {
        if (formatOptions) {
            return new Intl.NumberFormat('en-US', formatOptions).format(current);
        }
        return current.toFixed(decimals);
    });

    const [displayValue, setDisplayValue] = useState('0');

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        const unsubscribe = display.on('change', (v) => {
            setDisplayValue(v);
        });
        return () => unsubscribe();
    }, [display]);

    return (
        <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("tabular-nums", className)}
        >
            {prefix}{displayValue}{suffix}
        </motion.span>
    );
}

interface AnimatedPercentageProps {
    value: number;
    duration?: number;
    className?: string;
    showSign?: boolean;
}

export function AnimatedPercentage({
    value,
    duration = 1,
    className,
    showSign = true,
}: AnimatedPercentageProps) {
    const isPositive = value >= 0;
    const sign = showSign ? (isPositive ? '+' : '') : '';

    return (
        <span className={cn(
            "font-medium",
            isPositive ? "text-neon-emerald" : "text-plasma-pink",
            className
        )}>
            {sign}
            <AnimatedCounter value={value} duration={duration} decimals={1} suffix="%" />
        </span>
    );
}
