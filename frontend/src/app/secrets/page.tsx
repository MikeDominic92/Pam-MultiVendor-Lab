'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { SecretField } from '@/components/ui/SecretField';
import { GlassButton } from '@/components/ui/GlassButton';
import { NeonBadge } from '@/components/ui/NeonBadge';
import {
    Folder,
    FileKey,
    ChevronRight,
    ChevronDown,
    Plus,
    History,
    Trash2,
    Save,
    Search,
    Filter,
    Shield,
    Database,
    Cloud,
    MoreVertical,
    Copy,
    ExternalLink,
    Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const fileSystem = {
    name: 'secrets',
    type: 'mount',
    platform: 'unified',
    children: [
        {
            name: 'delinea',
            type: 'platform',
            platform: 'delinea',
            children: [
                {
                    name: 'IT Infrastructure',
                    type: 'folder',
                    children: [
                        { name: 'prod-db-admin', type: 'secret', template: 'Database' },
                        { name: 'dc01-admin', type: 'secret', template: 'Active Directory' },
                    ]
                },
                {
                    name: 'API Keys',
                    type: 'folder',
                    children: [
                        { name: 'aws-iam-deployment', type: 'secret', template: 'API Key' },
                    ]
                },
            ]
        },
        {
            name: 'aws',
            type: 'platform',
            platform: 'aws',
            children: [
                { name: 'prod/database/postgres', type: 'secret', template: 'RDS Credentials' },
                { name: 'prod/api/stripe', type: 'secret', template: 'API Key' },
            ]
        },
    ]
};

const platformIcons: Record<string, React.ElementType> = {
    delinea: Shield,
    aws: Cloud,
    vault: Database,
    unified: FileKey,
};

const platformColors: Record<string, string> = {
    delinea: 'text-orange-400',
    aws: 'text-yellow-400',
    vault: 'text-cyber-purple',
    unified: 'text-cyber-cyan',
};

export default function SecretBrowser() {
    const [selectedSecret, setSelectedSecret] = useState<string | null>('prod-db-admin');
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['secrets', 'delinea', 'IT Infrastructure']);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleFolder = (name: string) => {
        if (expandedFolders.includes(name)) {
            setExpandedFolders(expandedFolders.filter(f => f !== name));
        } else {
            setExpandedFolders([...expandedFolders, name]);
        }
    };

    const renderTree = (node: any, path: string = '', depth: number = 0) => {
        const currentPath = `${path}/${node.name}`;
        const isExpanded = expandedFolders.includes(node.name);
        const isSelected = selectedSecret === node.name;
        const PlatformIcon = node.platform ? platformIcons[node.platform] : Folder;
        const platformColor = node.platform ? platformColors[node.platform] : 'text-gray-500';

        return (
            <motion.div
                key={currentPath}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: depth * 0.05 }}
                style={{ paddingLeft: `${depth * 12}px` }}
            >
                <motion.div
                    whileHover={{ x: 2 }}
                    className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer transition-all duration-200 group",
                        isSelected
                            ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                    )}
                    onClick={() => node.type === 'secret' ? setSelectedSecret(node.name) : toggleFolder(node.name)}
                >
                    {(node.type !== 'secret') && (
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-4 h-4 flex items-center justify-center"
                        >
                            <ChevronRight className="w-3 h-3" />
                        </motion.div>
                    )}
                    {node.type === 'secret' && <div className="w-4" />}

                    <PlatformIcon className={cn("w-4 h-4 transition-colors", isSelected ? "text-cyber-cyan" : platformColor)} />

                    <span className="text-[13px] font-medium flex-1 truncate">{node.name}</span>

                    {node.template && (
                        <span className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded bg-white/[0.03]">
                            {node.template}
                        </span>
                    )}
                </motion.div>

                <AnimatePresence>
                    {isExpanded && node.children && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden ml-2 border-l border-white/[0.04]"
                        >
                            {node.children.map((child: any) => renderTree(child, currentPath, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <VaultShell>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[calc(100vh-8rem)] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1 font-orbitron">
                            Secret <span className="text-cyber-cyan">Browser</span>
                        </h1>
                        <p className="text-sm text-gray-500">Manage secrets across all connected platforms</p>
                    </div>
                    <GlassButton icon={<Plus className="w-4 h-4" />} glow>
                        Create Secret
                    </GlassButton>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                    {/* Tree Navigator */}
                    <div className="col-span-4 glass-card rounded-2xl flex flex-col overflow-hidden">
                        {/* Search */}
                        <div className="p-4 border-b border-white/[0.04]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search secrets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/30 border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-cyber-cyan/30 transition-all placeholder:text-gray-600"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/[0.05] transition-colors">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Platform Stats */}
                        <div className="p-4 border-b border-white/[0.04] flex gap-2">
                            <div className="flex-1 p-3 rounded-xl bg-black/20 text-center">
                                <p className="text-lg font-bold text-white">847</p>
                                <p className="text-[10px] text-orange-400">Delinea</p>
                            </div>
                            <div className="flex-1 p-3 rounded-xl bg-black/20 text-center">
                                <p className="text-lg font-bold text-white">1,234</p>
                                <p className="text-[10px] text-yellow-400">AWS</p>
                            </div>
                            <div className="flex-1 p-3 rounded-xl bg-black/20 text-center">
                                <p className="text-lg font-bold text-gray-500">--</p>
                                <p className="text-[10px] text-gray-600">Vault</p>
                            </div>
                        </div>

                        {/* Tree */}
                        <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {renderTree(fileSystem)}
                        </div>
                    </div>

                    {/* Secret Details */}
                    <div className="col-span-8 flex flex-col gap-4 overflow-y-auto">
                        {selectedSecret ? (
                            <>
                                {/* Header Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card p-5 rounded-2xl"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyber-cyan/20 to-cyber-purple/10 flex items-center justify-center border border-cyber-cyan/20 shadow-lg shadow-cyber-cyan/10">
                                                <FileKey className="w-7 h-7 text-cyber-cyan" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white">{selectedSecret}</h2>
                                                <p className="text-sm font-mono text-gray-500 mt-0.5">delinea://IT Infrastructure/{selectedSecret}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <NeonBadge variant="cyan" size="sm">Database</NeonBadge>
                                                    <NeonBadge variant="emerald" size="sm" pulse>Active</NeonBadge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-gray-400 hover:text-white">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-gray-400 hover:text-white">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-gray-400 hover:text-white">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/[0.04]">
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Version</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-mono text-sm">v2</span>
                                                <History className="w-3 h-3 text-gray-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Last Updated</p>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-gray-500" />
                                                <span className="text-white text-sm">2h ago</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Platform</p>
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-3 h-3 text-orange-400" />
                                                <span className="text-white text-sm">Delinea</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Access</p>
                                            <span className="text-neon-emerald text-sm">Read/Write</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Secret Data Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card p-5 rounded-2xl flex-1"
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-sm font-semibold text-white">Secret Fields</h3>
                                        <span className="text-[10px] text-gray-600 font-mono">4 fields</span>
                                    </div>

                                    <div className="space-y-4">
                                        <SecretField label="Server" value="sql-prod-01.internal.corp" />
                                        <SecretField label="Database" value="production_db" />
                                        <SecretField label="Username" value="sa_admin" />
                                        <SecretField label="Password" value="v4ult_g3n3r4t3d_P@ssw0rd!" />
                                    </div>

                                    <div className="pt-5 mt-5 border-t border-white/[0.04] flex items-center justify-between">
                                        <GlassButton variant="danger" icon={<Trash2 className="w-4 h-4" />}>
                                            Delete
                                        </GlassButton>
                                        <GlassButton icon={<Save className="w-4 h-4" />} glow>
                                            Save Changes
                                        </GlassButton>
                                    </div>
                                </motion.div>

                                {/* Version History Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="glass-card p-5 rounded-2xl"
                                >
                                    <h3 className="text-sm font-semibold text-white mb-4">Version History</h3>
                                    <div className="space-y-2">
                                        {[
                                            { v: 2, time: '2 hours ago', user: 'sys-admin', status: 'current' },
                                            { v: 1, time: '5 days ago', user: 'deploy-bot', status: 'archived' },
                                        ].map((ver, i) => (
                                            <motion.div
                                                key={ver.v}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + i * 0.05 }}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-xl flex items-center justify-center font-mono text-sm border transition-all",
                                                        ver.status === 'current'
                                                            ? "bg-neon-emerald/10 border-neon-emerald/30 text-neon-emerald shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                            : "bg-white/[0.02] border-white/[0.06] text-gray-500"
                                                    )}>
                                                        v{ver.v}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Updated by <span className="text-cyber-cyan">{ver.user}</span></p>
                                                        <p className="text-xs text-gray-600">{ver.time}</p>
                                                    </div>
                                                </div>
                                                {ver.status === 'current' && (
                                                    <NeonBadge variant="emerald" size="sm">Current</NeonBadge>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center glass-card rounded-2xl">
                                <div className="w-20 h-20 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-4">
                                    <FileKey className="w-10 h-10 text-gray-700" />
                                </div>
                                <p className="text-gray-500 text-sm">Select a secret to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </VaultShell>
    );
}
