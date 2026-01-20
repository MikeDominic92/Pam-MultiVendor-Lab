'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Cyber-themed chart configuration
export const chartColors = {
    cyan: '#00f5ff',
    purple: '#a855f7',
    emerald: '#10b981',
    gold: '#fbbf24',
    pink: '#ec4899',
    gray: '#6b7280',
};

export const chartGradients = {
    cyan: {
        id: 'gradientCyan',
        startColor: '#00f5ff',
        startOpacity: 0.3,
        endOpacity: 0,
    },
    purple: {
        id: 'gradientPurple',
        startColor: '#a855f7',
        startOpacity: 0.3,
        endOpacity: 0,
    },
    emerald: {
        id: 'gradientEmerald',
        startColor: '#10b981',
        startOpacity: 0.3,
        endOpacity: 0,
    },
    gold: {
        id: 'gradientGold',
        startColor: '#fbbf24',
        startOpacity: 0.3,
        endOpacity: 0,
    },
    pink: {
        id: 'gradientPink',
        startColor: '#ec4899',
        startOpacity: 0.3,
        endOpacity: 0,
    },
};

export const ChartGradientDefs = () => (
    <defs>
        {Object.entries(chartGradients).map(([key, gradient]) => (
            <linearGradient key={key} id={gradient.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradient.startColor} stopOpacity={gradient.startOpacity} />
                <stop offset="95%" stopColor={gradient.startColor} stopOpacity={gradient.endOpacity} />
            </linearGradient>
        ))}
        {/* Glow filter for data points */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
);

export const chartTooltipStyle = {
    contentStyle: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        padding: '12px 16px',
    },
    itemStyle: {
        color: '#fff',
        fontSize: '12px',
        fontFamily: 'monospace',
    },
    labelStyle: {
        color: '#888',
        fontSize: '11px',
        marginBottom: '4px',
    },
};

export const chartAxisStyle = {
    stroke: '#333',
    fontSize: 10,
    tickLine: false,
    axisLine: false,
    fontFamily: 'monospace',
};

export const chartGridStyle = {
    strokeDasharray: '3 3',
    stroke: 'rgba(255,255,255,0.03)',
    vertical: false,
};

// Custom tooltip component
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        color: string;
        dataKey: string;
    }>;
    label?: string;
}

export const GlassTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-3 rounded-xl border border-white/10"
            style={{
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
        >
            <p className="text-xs text-gray-400 mb-2 font-mono">{label}</p>
            <div className="space-y-1.5">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: entry.color,
                                boxShadow: `0 0 6px ${entry.color}`,
                            }}
                        />
                        <span className="text-xs text-gray-300 capitalize">{entry.name || entry.dataKey}:</span>
                        <span className="text-xs font-bold text-white font-mono">{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// Animated dot for data points
interface AnimatedDotProps {
    cx?: number;
    cy?: number;
    fill?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
    index?: number;
}

export const AnimatedDot: React.FC<AnimatedDotProps> = ({ cx, cy, fill }) => {
    if (cx === undefined || cy === undefined) return null;

    return (
        <motion.circle
            cx={cx}
            cy={cy}
            r={4}
            fill={fill}
            stroke={fill}
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.5 }}
            style={{ filter: 'url(#glow)' }}
        />
    );
};

// Mini sparkline chart component
interface SparklineProps {
    data: number[];
    color?: keyof typeof chartColors;
    width?: number;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
    data,
    color = 'cyan',
    width = 80,
    height = 24,
}) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;
    const strokeColor = chartColors[color];

    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
            </defs>
            <polygon
                points={areaPoints}
                fill={`url(#sparkline-${color})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* End point dot */}
            <circle
                cx={width}
                cy={height - ((data[data.length - 1] - min) / range) * height}
                r={2}
                fill={strokeColor}
                style={{ filter: 'drop-shadow(0 0 4px ' + strokeColor + ')' }}
            />
        </svg>
    );
};

// Progress ring component
interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: keyof typeof chartColors;
    label?: string;
    value?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 80,
    strokeWidth = 6,
    color = 'cyan',
    label,
    value,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    const strokeColor = chartColors[color];

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress ring */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                        filter: `drop-shadow(0 0 6px ${strokeColor})`,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {value && <span className="text-lg font-bold text-white">{value}</span>}
                {label && <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>}
            </div>
        </div>
    );
};

// Bar chart item component for simple bar displays
interface BarItemProps {
    label: string;
    value: number;
    maxValue: number;
    color?: keyof typeof chartColors;
    suffix?: string;
}

export const BarItem: React.FC<BarItemProps> = ({
    label,
    value,
    maxValue,
    color = 'cyan',
    suffix = '',
}) => {
    const percentage = (value / maxValue) * 100;
    const barColor = chartColors[color];

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-mono text-white">{value.toLocaleString()}{suffix}</span>
            </div>
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        backgroundColor: barColor,
                        boxShadow: `0 0 10px ${barColor}40`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};
