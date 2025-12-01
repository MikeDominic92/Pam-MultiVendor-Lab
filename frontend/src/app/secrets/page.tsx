'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { VaultCard } from '@/components/ui/VaultCard';
import { SecretField } from '@/components/ui/SecretField';
import { Folder, FileKey, ChevronRight, ChevronDown, Plus, History, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const fileSystem = {
    name: 'secret',
    type: 'mount',
    children: [
        {
            name: 'data',
            type: 'folder',
            children: [
                { name: 'app-config', type: 'secret' },
                { name: 'prod-db', type: 'secret' },
                { name: 'api-keys', type: 'secret' },
            ]
        },
        {
            name: 'metadata',
            type: 'folder',
            children: []
        }
    ]
};

export default function SecretBrowser() {
    const [selectedSecret, setSelectedSecret] = useState<string | null>('app-config');
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['secret', 'data']);

    const toggleFolder = (name: string) => {
        if (expandedFolders.includes(name)) {
            setExpandedFolders(expandedFolders.filter(f => f !== name));
        } else {
            setExpandedFolders([...expandedFolders, name]);
        }
    };

    const renderTree = (node: any, path: string = '') => {
        const currentPath = `${path}/${node.name}`;
        const isExpanded = expandedFolders.includes(node.name);
        const isSelected = selectedSecret === node.name;

        return (
            <div key={currentPath} className="pl-4">
                <div
                    className={cn(
                        "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-vault-gold/10 text-vault-gold" : "text-slate-gray hover:text-ghost-white hover:bg-white/5"
                    )}
                    onClick={() => node.type === 'secret' ? setSelectedSecret(node.name) : toggleFolder(node.name)}
                >
                    {node.type !== 'secret' && (
                        <div className="w-4 h-4 flex items-center justify-center">
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </div>
                    )}
                    {node.type === 'mount' ? <Folder className="w-4 h-4 text-vault-gold" /> :
                        node.type === 'folder' ? <Folder className="w-4 h-4 text-slate-500" /> :
                            <FileKey className="w-4 h-4" />}
                    <span className="text-sm font-medium">{node.name}</span>
                </div>

                <AnimatePresence>
                    {isExpanded && node.children && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-l border-white/5 ml-3"
                        >
                            {node.children.map((child: any) => renderTree(child, currentPath))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <VaultShell>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-ghost-white mb-2">Secret Browser</h1>
                        <p className="text-slate-gray">Manage and version static secrets.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-vault-gold hover:bg-amber-400 text-obsidian-black font-bold rounded-lg transition-colors shadow-gold-glow">
                        <Plus className="w-4 h-4" />
                        <span>Create Secret</span>
                    </button>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                    {/* Tree Navigator */}
                    <div className="col-span-3 bg-vault-surface border border-white/5 rounded-xl p-4 overflow-y-auto">
                        <div className="text-xs font-bold text-slate-gray uppercase tracking-wider mb-4 px-2">Secret Engines</div>
                        {renderTree(fileSystem)}
                    </div>

                    {/* Secret Details */}
                    <div className="col-span-9 flex flex-col gap-6 overflow-y-auto">
                        {selectedSecret ? (
                            <>
                                {/* Header & Metadata */}
                                <VaultCard className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-vault-gold/10 border border-vault-gold/20">
                                            <FileKey className="w-6 h-6 text-vault-gold" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-ghost-white">{selectedSecret}</h2>
                                            <p className="text-sm font-mono text-slate-gray">secret/data/{selectedSecret}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-slate-gray">
                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-wider mb-1">Version</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="font-mono text-ghost-white">v2</span>
                                                <History className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <div className="h-8 w-px bg-white/10" />
                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-wider mb-1">Updated</p>
                                            <p className="font-mono text-ghost-white">2h ago</p>
                                        </div>
                                    </div>
                                </VaultCard>

                                {/* Secret Data */}
                                <VaultCard title="Secret Data" className="flex-1">
                                    <div className="space-y-6">
                                        <SecretField label="API_KEY" value="sk_live_51Mz...8s9d" />
                                        <SecretField label="DB_PASSWORD" value="v4ult_g3n3r4t3d_P@ssw0rd!" />
                                        <SecretField label="WEBHOOK_SECRET" value="whsec_...7d8f" />

                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <button className="flex items-center gap-2 px-4 py-2 text-ruby-danger hover:bg-ruby-danger/10 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete Version</span>
                                            </button>
                                            <button className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 text-ghost-white rounded-lg transition-colors border border-white/10">
                                                <Save className="w-4 h-4" />
                                                <span>Save New Version</span>
                                            </button>
                                        </div>
                                    </div>
                                </VaultCard>

                                {/* Version History */}
                                <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                                    <h3 className="text-sm font-bold text-slate-gray uppercase tracking-wider mb-4">Version History</h3>
                                    <div className="space-y-2">
                                        {[
                                            { v: 2, time: '2 hours ago', user: 'sys-admin', status: 'current' },
                                            { v: 1, time: '5 days ago', user: 'deploy-bot', status: 'archived' },
                                        ].map((ver) => (
                                            <div key={ver.v} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border",
                                                        ver.status === 'current' ? "bg-emerald-success/10 border-emerald-success/30 text-emerald-success" : "bg-white/5 border-white/10 text-slate-gray"
                                                    )}>
                                                        v{ver.v}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-ghost-white">Updated by {ver.user}</p>
                                                        <p className="text-xs text-slate-gray">{ver.time}</p>
                                                    </div>
                                                </div>
                                                {ver.status === 'current' && (
                                                    <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-emerald-success/10 text-emerald-success border border-emerald-success/20">Current</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-gray">
                                <FileKey className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a secret to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </VaultShell>
    );
}
