'use client';

import React from 'react';
import { VaultSidebar } from './VaultSidebar';
import { VaultHeader } from './VaultHeader';
import { motion } from 'framer-motion';

interface VaultShellProps {
    children: React.ReactNode;
}

export function VaultShell({ children }: VaultShellProps) {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyber-cyan/30 selection:text-white">
            <VaultSidebar />
            <VaultHeader />

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="ml-[17.5rem] pt-6 pr-6 pb-6 relative z-10 min-h-screen"
            >
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </motion.main>
        </div>
    );
}
