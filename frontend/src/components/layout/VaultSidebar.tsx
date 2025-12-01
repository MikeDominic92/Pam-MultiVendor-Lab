'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Key, RefreshCw, ShieldCheck, FileText, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Secrets', href: '/secrets', icon: Key },
    { name: 'Dyn. Creds', href: '/credentials', icon: RefreshCw },
    { name: 'PKI / Certs', href: '/pki', icon: ShieldCheck },
    { name: 'Audit Log', href: '/audit', icon: FileText },
];

export function VaultSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r border-white/5 bg-obsidian-black h-screen fixed left-0 top-0 flex flex-col z-50">
            <div className="p-6 flex items-center gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-vault-gold/10 flex items-center justify-center border border-vault-gold/30">
                    <Lock className="w-5 h-5 text-vault-gold" />
                </div>
                <span className="font-bold text-xl text-ghost-white tracking-tight">Vault Lab</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-white/5 text-vault-gold"
                                    : "text-slate-gray hover:text-ghost-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-vault-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                                />
                            )}
                            <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-vault-gold" : "group-hover:text-ghost-white")} />
                            <span className="font-medium text-sm">{item.name}</span>
                            {isActive && <ChevronRight className="w-4 h-4 ml-auto text-vault-gold/50" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-vault-surface to-black border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-success animate-pulse" />
                        <span className="text-xs font-medium text-emerald-success">Unsealed</span>
                    </div>
                    <p className="text-xs text-slate-gray font-mono">v1.15.2+ent</p>
                </div>
            </div>
        </div>
    );
}
