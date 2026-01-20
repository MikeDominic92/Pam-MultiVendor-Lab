'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: number | string;
    height?: number | string;
    animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    animation = 'shimmer',
}: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden bg-white/[0.03]",
                variant === 'circular' && "rounded-full",
                variant === 'rectangular' && "rounded-lg",
                variant === 'text' && "rounded h-4",
                animation === 'pulse' && "animate-pulse",
                animation === 'shimmer' && "skeleton-shimmer",
                className
            )}
            style={{
                width: width,
                height: height,
            }}
        />
    );
}

// Skeleton card for loading states
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn("glass-card p-5 rounded-2xl space-y-4", className)}>
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" height={10} />
                </div>
            </div>
            <div className="space-y-2">
                <Skeleton variant="rectangular" height={100} />
            </div>
        </div>
    );
}

// Skeleton for table rows
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-white/[0.04]">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    width={`${Math.random() * 30 + 50}%`}
                    height={12}
                />
            ))}
        </div>
    );
}

// Skeleton for stat cards
export function SkeletonStatCard() {
    return (
        <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-start justify-between mb-3">
                <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
                <Skeleton variant="rectangular" width={60} height={20} className="rounded" />
            </div>
            <Skeleton variant="text" width="50%" height={24} className="mb-2" />
            <Skeleton variant="text" width="70%" height={12} />
        </div>
    );
}

// Skeleton for chart
export function SkeletonChart() {
    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="25%" height={10} />
                </div>
            </div>
            <Skeleton variant="rectangular" height={200} className="rounded-xl" />
        </div>
    );
}

// Full page loading skeleton
export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton variant="text" width={200} height={28} />
                    <Skeleton variant="text" width={300} height={14} />
                </div>
                <Skeleton variant="rectangular" width={150} height={40} className="rounded-xl" />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonStatCard key={i} />
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8">
                    <SkeletonChart />
                </div>
                <div className="col-span-4">
                    <SkeletonCard />
                </div>
            </div>
        </div>
    );
}
