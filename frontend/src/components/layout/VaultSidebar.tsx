'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Key, RefreshCw, ShieldCheck, FileText, ChevronRight, Lock, LogOut, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, description: 'Overview & metrics' },
    { name: 'Secrets', href: '/secrets', icon: Key, description: 'Manage secrets' },
    { name: 'Credentials', href: '/credentials', icon: RefreshCw, description: 'Dynamic credentials' },
    { name: 'PKI / Certs', href: '/pki', icon: ShieldCheck, description: 'Certificate authority' },
    { name: 'Audit Log', href: '/audit', icon: FileText, description: 'Activity history' },
];

const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
            damping: 20,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
};

export function VaultSidebar() {
    const pathname = usePathname();

    return (
        <motion.aside
            initial="hidden"
            animate="visible"
            variants={sidebarVariants}
            className="w-[260px] h-[calc(100vh-2rem)] flex flex-col fixed left-4 top-4 z-50 rounded-2xl overflow-hidden"
        >
            {/* Glass background with gradient border */}
            <div className="absolute inset-0 glass-panel rounded-2xl" />
            <div className="absolute inset-0 rounded-2xl border border-white/[0.08] pointer-events-none" />

            {/* Ambient glow at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-cyber-cyan/20 rounded-full blur-[60px] pointer-events-none" />

            {/* Logo section */}
            <div className="relative h-20 flex items-center px-5 border-b border-white/[0.06]">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyber-cyan via-cyber-purple to-cyber-cyan flex items-center justify-center border border-white/20 shadow-lg shadow-cyber-cyan/20 mr-3 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <Lock className="w-5 h-5 text-white relative z-10" />
                </motion.div>
                <div className="flex flex-col">
                    <span className="font-orbitron font-bold text-lg tracking-tight text-white">
                        PAM<span className="text-cyber-cyan">Lab</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono tracking-wider">MULTI-VENDOR</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <AnimatePresence mode="wait">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <motion.div key={item.href} variants={itemVariants}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "text-cyber-cyan"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {/* Active background */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNavBg"
                                            className="absolute inset-0 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-xl"
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    {/* Hover background */}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] rounded-xl transition-colors duration-300" />
                                    )}

                                    {/* Active indicator line */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-2 bottom-2 w-[3px] bg-cyber-cyan rounded-full shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                                        />
                                    )}

                                    {/* Icon */}
                                    <div className={cn(
                                        "relative z-10 w-9 h-9 rounded-lg flex items-center justify-center mr-3 transition-all duration-300",
                                        isActive
                                            ? "bg-cyber-cyan/20 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                                            : "bg-white/[0.03] group-hover:bg-white/[0.06]"
                                    )}>
                                        <item.icon className={cn(
                                            "w-4 h-4 transition-all duration-300",
                                            isActive ? "text-cyber-cyan" : "text-gray-500 group-hover:text-white"
                                        )} />
                                    </div>

                                    {/* Text */}
                                    <div className="relative z-10 flex-1">
                                        <span className="block font-medium text-[13px]">{item.name}</span>
                                        <span className={cn(
                                            "block text-[10px] transition-colors",
                                            isActive ? "text-cyber-cyan/60" : "text-gray-600 group-hover:text-gray-500"
                                        )}>{item.description}</span>
                                    </div>

                                    {/* Arrow */}
                                    {isActive && (
                                        <ChevronRight className="relative z-10 w-4 h-4 text-cyber-cyan/50" />
                                    )}
                                </Link>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </nav>

            {/* Status section */}
            <div className="relative p-3 border-t border-white/[0.06] space-y-2">
                {/* Platform status */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Platform Status</span>
                        <Sparkles className="w-3 h-3 text-cyber-cyan animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">Delinea</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-emerald animate-pulse shadow-[0_0_6px_#10b981]" />
                                <span className="text-[10px] text-neon-emerald font-mono">Online</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">AWS Secrets</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-emerald animate-pulse shadow-[0_0_6px_#10b981]" />
                                <span className="text-[10px] text-neon-emerald font-mono">Online</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">HashiCorp Vault</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                                <span className="text-[10px] text-gray-500 font-mono">Offline</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sign out */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-plasma-pink hover:bg-plasma-pink/10 border border-transparent hover:border-plasma-pink/20 transition-all duration-300"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="text-[13px]">Sign Out</span>
                </motion.button>
            </div>
        </motion.aside>
    );
}

