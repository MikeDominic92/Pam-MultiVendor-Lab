'use client';

import React, { useState } from 'react';
import { Search, Bell, Shield, Command, Zap, Activity } from 'lucide-react';
import { IdentityBadge } from '../ui/IdentityBadge';
import { motion, AnimatePresence } from 'framer-motion';

export function VaultHeader() {
    const [searchFocused, setSearchFocused] = useState(false);
    const [notifications] = useState(3);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-[72px] sticky top-4 z-40 mx-4 ml-[17.5rem] rounded-2xl overflow-hidden"
        >
            {/* Glass background */}
            <div className="absolute inset-0 glass-panel" />
            <div className="absolute inset-0 border border-white/[0.06] rounded-2xl pointer-events-none" />

            <div className="relative h-full px-6 flex items-center justify-between">
                {/* Search section */}
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <div className="relative w-full group">
                        <motion.div
                            animate={{
                                boxShadow: searchFocused
                                    ? '0 0 20px rgba(0, 245, 255, 0.15)'
                                    : '0 0 0px rgba(0, 245, 255, 0)'
                            }}
                            className="relative"
                        >
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${searchFocused ? 'text-cyber-cyan' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Search secrets, policies, credentials..."
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="w-full bg-black/30 border border-white/[0.06] rounded-xl py-3 pl-11 pr-20 text-sm text-white focus:outline-none focus:border-cyber-cyan/30 focus:bg-black/40 transition-all duration-300 placeholder:text-gray-600"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
                                <Command className="w-3 h-3 text-gray-500" />
                                <span className="text-[10px] text-gray-500 font-mono">K</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-4">
                    {/* Live metrics */}
                    <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-black/20 border border-white/[0.04]">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-neon-emerald" />
                            <span className="text-[11px] text-gray-400">
                                <span className="text-neon-emerald font-medium">127</span> ops/min
                            </span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-vault-gold" />
                            <span className="text-[11px] text-gray-400">
                                <span className="text-vault-gold font-medium">12ms</span> latency
                            </span>
                        </div>
                    </div>

                    {/* Status badge */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-vault-gold/10 border border-vault-gold/20 cursor-pointer"
                    >
                        <Shield className="w-3.5 h-3.5 text-vault-gold" />
                        <span className="text-[11px] font-medium text-vault-gold">Admin Access</span>
                    </motion.div>

                    {/* Notifications */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative p-2.5 rounded-xl bg-black/20 border border-white/[0.04] hover:border-cyber-cyan/20 transition-all duration-300 group"
                    >
                        <Bell className="w-4.5 h-4.5 text-gray-400 group-hover:text-cyber-cyan transition-colors" />
                        <AnimatePresence>
                            {notifications > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-cyber-purple text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                >
                                    {notifications}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* Divider */}
                    <div className="h-8 w-px bg-white/[0.06]" />

                    {/* Identity */}
                    <IdentityBadge />
                </div>
            </div>
        </motion.header>
    );
}

