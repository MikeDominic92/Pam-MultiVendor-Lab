import React from 'react';
import { VaultSidebar } from './VaultSidebar';
import { VaultHeader } from './VaultHeader';

interface VaultShellProps {
    children: React.ReactNode;
}

export function VaultShell({ children }: VaultShellProps) {
    return (
        <div className="min-h-screen bg-obsidian-black text-ghost-white font-sans selection:bg-vault-gold/30 selection:text-white">
            <VaultSidebar />
            <VaultHeader />

            <main className="ml-64 p-8 relative z-10 min-h-[calc(100vh-4rem)]">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
