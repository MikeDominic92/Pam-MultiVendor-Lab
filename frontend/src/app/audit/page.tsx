'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { GlassButton } from '@/components/ui/GlassButton';
import { NeonBadge } from '@/components/ui/NeonBadge';
import {
    FileText, Shield, Search, Filter, Code, Check, Clock,
    Activity, AlertTriangle, Eye, Edit3, Trash2, List,
    Download, RefreshCw, ChevronRight, Terminal, Lock,
    TrendingUp, Users, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const policies = [
    { name: 'admin-policy', type: 'acl', paths: 12, lastModified: '2h ago' },
    { name: 'app-read-only', type: 'acl', paths: 3, lastModified: '1d ago' },
    { name: 'pki-issuer', type: 'acl', paths: 5, lastModified: '3d ago' },
    { name: 'db-creds-rotator', type: 'acl', paths: 8, lastModified: '1w ago' },
    { name: 'deployment-bot', type: 'acl', paths: 15, lastModified: '2w ago' },
];

const auditLogs = [
    { id: 1, time: '10:42:15', type: 'read', path: 'secret/data/app-config', actor: 'web-service', status: 'success', platform: 'vault' },
    { id: 2, time: '10:41:03', type: 'update', path: 'sys/policy/admin', actor: 'sys-admin', status: 'success', platform: 'vault' },
    { id: 3, time: '10:38:55', type: 'delete', path: 'secret/data/legacy-creds', actor: 'sys-admin', status: 'success', platform: 'delinea' },
    { id: 4, time: '10:35:12', type: 'read', path: 'secret/data/prod-db', actor: 'unknown', status: 'denied', platform: 'vault' },
    { id: 5, time: '10:30:00', type: 'list', path: 'pki/roles', actor: 'deploy-bot', status: 'success', platform: 'vault' },
    { id: 6, time: '10:28:45', type: 'create', path: 'auth/token/create', actor: 'auth-service', status: 'success', platform: 'aws' },
    { id: 7, time: '10:25:30', type: 'read', path: 'database/creds/readonly', actor: 'app-server', status: 'success', platform: 'delinea' },
    { id: 8, time: '10:22:18', type: 'update', path: 'secret/metadata/config', actor: 'config-bot', status: 'success', platform: 'vault' },
];

const initialPolicyContent = `# Policy: app-read-only
# Allows read access to application configuration secrets

path "secret/data/app-config" {
  capabilities = ["read"]
}

path "secret/data/app-config/*" {
  capabilities = ["read", "list"]
}

path "sys/mounts" {
  capabilities = ["read", "list"]
}

path "pki/issue/*" {
  capabilities = ["create", "update"]
}

# Deny access to admin paths
path "secret/data/admin/*" {
  capabilities = ["deny"]
}`;

const typeIcons: Record<string, React.ElementType> = {
    read: Eye,
    create: Edit3,
    update: RefreshCw,
    delete: Trash2,
    list: List,
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    read: { bg: 'bg-cyber-cyan/10', text: 'text-cyber-cyan', border: 'border-cyber-cyan/20' },
    create: { bg: 'bg-neon-emerald/10', text: 'text-neon-emerald', border: 'border-neon-emerald/20' },
    update: { bg: 'bg-vault-gold/10', text: 'text-vault-gold', border: 'border-vault-gold/20' },
    delete: { bg: 'bg-plasma-pink/10', text: 'text-plasma-pink', border: 'border-plasma-pink/20' },
    list: { bg: 'bg-cyber-purple/10', text: 'text-cyber-purple', border: 'border-cyber-purple/20' },
};

export default function AuditPolicies() {
    const [activeTab, setActiveTab] = useState<'audit' | 'policies'>('audit');
    const [selectedPolicy, setSelectedPolicy] = useState('app-read-only');
    const [policyContent, setPolicyContent] = useState(initialPolicyContent);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const filters = ['read', 'create', 'update', 'delete', 'list'];

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev =>
            prev.includes(filter)
                ? prev.filter(f => f !== filter)
                : [...prev, filter]
        );
    };

    const filteredLogs = auditLogs.filter(log => {
        const matchesSearch = searchQuery === '' ||
            log.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilters.length === 0 || activeFilters.includes(log.type);
        return matchesSearch && matchesFilter;
    });

    return (
        <VaultShell>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1 font-orbitron">
                            Audit & <span className="text-cyber-cyan">Policies</span>
                        </h1>
                        <p className="text-sm text-gray-500">Monitor access logs and manage ACL policies</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Tab Switcher */}
                        <div className="flex p-1 rounded-xl bg-black/30 border border-white/[0.06]">
                            {[
                                { id: 'audit', label: 'Audit Log', icon: Activity },
                                { id: 'policies', label: 'Policies', icon: Shield },
                            ].map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'audit' | 'policies')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                                        activeTab === tab.id
                                            ? "text-cyber-cyan"
                                            : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-lg"
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <tab.icon className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">{tab.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Total Events', value: '12,847', icon: Activity, color: 'cyan', change: '+12%' },
                        { label: 'Denied Requests', value: '23', icon: AlertTriangle, color: 'pink', change: '-8%' },
                        { label: 'Active Policies', value: '5', icon: Shield, color: 'purple', change: '0' },
                        { label: 'Unique Actors', value: '48', icon: Users, color: 'emerald', change: '+3' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="glass-card p-4 rounded-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        stat.color === 'cyan' && "bg-cyber-cyan/10 text-cyber-cyan",
                                        stat.color === 'pink' && "bg-plasma-pink/10 text-plasma-pink",
                                        stat.color === 'purple' && "bg-cyber-purple/10 text-cyber-purple",
                                        stat.color === 'emerald' && "bg-neon-emerald/10 text-neon-emerald",
                                    )}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-white">{stat.value}</p>
                                        <p className="text-[10px] text-gray-500">{stat.label}</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-lg",
                                    stat.change.startsWith('+') ? "bg-neon-emerald/10 text-neon-emerald" :
                                    stat.change.startsWith('-') ? "bg-plasma-pink/10 text-plasma-pink" :
                                    "bg-gray-500/10 text-gray-500"
                                )}>
                                    {stat.change}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'audit' ? (
                        <motion.div
                            key="audit"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Search and Filters */}
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by path, actor, or request ID..."
                                        className="w-full bg-black/30 border border-white/[0.06] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-cyan/30 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/30 border border-white/[0.06]">
                                    {filters.map((filter) => {
                                        const Icon = typeIcons[filter];
                                        const colors = typeColors[filter];
                                        const isActive = activeFilters.includes(filter);
                                        return (
                                            <motion.button
                                                key={filter}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => toggleFilter(filter)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                                    isActive
                                                        ? `${colors.bg} ${colors.text} ${colors.border}`
                                                        : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                                                )}
                                            >
                                                <Icon className="w-3 h-3" />
                                                <span className="capitalize">{filter}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <GlassButton variant="secondary" icon={<Download className="w-4 h-4" />}>
                                    Export
                                </GlassButton>
                            </div>

                            {/* Log Stream */}
                            <div className="glass-card rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                                            <Terminal className="w-5 h-5 text-cyber-cyan" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Live Audit Stream</h3>
                                            <p className="text-xs text-gray-500">Real-time access events across all platforms</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse" />
                                        <span className="text-xs text-neon-emerald">Live</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-black/20 text-gray-500 font-medium uppercase tracking-wider text-[10px]">
                                            <tr>
                                                <th className="px-5 py-4 w-24">Time</th>
                                                <th className="px-5 py-4 w-28">Type</th>
                                                <th className="px-5 py-4">Path</th>
                                                <th className="px-5 py-4 w-32">Actor</th>
                                                <th className="px-5 py-4 w-24">Platform</th>
                                                <th className="px-5 py-4 w-24 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {filteredLogs.map((log, i) => {
                                                const Icon = typeIcons[log.type];
                                                const colors = typeColors[log.type];
                                                return (
                                                    <motion.tr
                                                        key={log.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3 h-3 text-gray-600" />
                                                                <span className="font-mono text-xs text-gray-400">{log.time}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className={cn(
                                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
                                                                colors.bg, colors.text, colors.border
                                                            )}>
                                                                <Icon className="w-3 h-3" />
                                                                <span className="capitalize">{log.type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <code className="font-mono text-xs text-white group-hover:text-cyber-cyan transition-colors">
                                                                    {log.path}
                                                                </code>
                                                                <ChevronRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={cn(
                                                                "text-sm",
                                                                log.actor === 'unknown' ? "text-plasma-pink" : "text-vault-gold"
                                                            )}>
                                                                {log.actor}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <NeonBadge
                                                                variant={
                                                                    log.platform === 'vault' ? 'purple' :
                                                                    log.platform === 'delinea' ? 'cyan' : 'gold'
                                                                }
                                                                size="sm"
                                                            >
                                                                {log.platform}
                                                            </NeonBadge>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <NeonBadge
                                                                variant={log.status === 'success' ? 'emerald' : 'pink'}
                                                                size="sm"
                                                                glow={log.status === 'denied'}
                                                            >
                                                                {log.status}
                                                            </NeonBadge>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="p-4 border-t border-white/[0.04] flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        Showing <span className="text-white">{filteredLogs.length}</span> of <span className="text-white">12,847</span> events
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <GlassButton variant="ghost" size="sm">Previous</GlassButton>
                                        <GlassButton variant="ghost" size="sm">Next</GlassButton>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="policies"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-12 gap-6"
                        >
                            {/* Policy List */}
                            <div className="col-span-4">
                                <div className="glass-card rounded-2xl overflow-hidden">
                                    <div className="p-4 border-b border-white/[0.04]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-cyber-purple" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">ACL Policies</h3>
                                                    <p className="text-xs text-gray-500">{policies.length} policies configured</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Search policies..."
                                                className="w-full bg-black/30 border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-cyber-purple/30 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
                                        {policies.map((policy, i) => (
                                            <motion.button
                                                key={policy.name}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => setSelectedPolicy(policy.name)}
                                                className={cn(
                                                    "w-full text-left p-3 rounded-xl transition-all relative group",
                                                    selectedPolicy === policy.name
                                                        ? "bg-cyber-purple/10 border border-cyber-purple/20"
                                                        : "hover:bg-white/[0.02] border border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Lock className={cn(
                                                            "w-4 h-4",
                                                            selectedPolicy === policy.name ? "text-cyber-purple" : "text-gray-500"
                                                        )} />
                                                        <span className={cn(
                                                            "font-mono text-sm",
                                                            selectedPolicy === policy.name ? "text-cyber-purple" : "text-white"
                                                        )}>
                                                            {policy.name}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 transition-all",
                                                        selectedPolicy === policy.name
                                                            ? "text-cyber-purple opacity-100"
                                                            : "text-gray-600 opacity-0 group-hover:opacity-100"
                                                    )} />
                                                </div>
                                                <div className="flex items-center gap-3 ml-6 text-[10px] text-gray-500">
                                                    <span>{policy.paths} paths</span>
                                                    <span>Modified {policy.lastModified}</span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-white/[0.04]">
                                        <GlassButton variant="secondary" className="w-full" icon={<FileText className="w-4 h-4" />}>
                                            Create New Policy
                                        </GlassButton>
                                    </div>
                                </div>
                            </div>

                            {/* Policy Editor */}
                            <div className="col-span-8 space-y-4">
                                <div className="glass-card rounded-2xl overflow-hidden">
                                    <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-vault-gold/10 flex items-center justify-center">
                                                <Code className="w-5 h-5 text-vault-gold" />
                                            </div>
                                            <div>
                                                <h3 className="font-mono text-sm text-white">{selectedPolicy}.hcl</h3>
                                                <p className="text-xs text-gray-500">HashiCorp Configuration Language</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <GlassButton variant="ghost" size="sm" icon={<RefreshCw className="w-3 h-3" />}>
                                                Reset
                                            </GlassButton>
                                            <GlassButton variant="primary" size="sm" glow icon={<Check className="w-3 h-3" />}>
                                                Save Policy
                                            </GlassButton>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/40 border-r border-white/[0.04] flex flex-col items-center pt-4 text-[10px] font-mono text-gray-600">
                                            {policyContent.split('\n').map((_, i) => (
                                                <div key={i} className="h-[1.625rem] leading-[1.625rem]">{i + 1}</div>
                                            ))}
                                        </div>
                                        <textarea
                                            value={policyContent}
                                            onChange={(e) => setPolicyContent(e.target.value)}
                                            className="w-full h-[400px] bg-black/20 p-4 pl-16 font-mono text-sm text-gray-300 resize-none focus:outline-none leading-[1.625rem]"
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>

                                {/* Policy Analysis */}
                                <div className="grid grid-cols-3 gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="glass-card p-4 rounded-xl"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap className="w-4 h-4 text-cyber-cyan" />
                                            <h4 className="text-sm font-medium text-white">Capabilities</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <NeonBadge variant="cyan" size="sm">read</NeonBadge>
                                            <NeonBadge variant="emerald" size="sm">list</NeonBadge>
                                            <NeonBadge variant="gold" size="sm">create</NeonBadge>
                                            <NeonBadge variant="gold" size="sm">update</NeonBadge>
                                            <NeonBadge variant="pink" size="sm">deny</NeonBadge>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="glass-card p-4 rounded-xl"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="w-4 h-4 text-neon-emerald" />
                                            <h4 className="text-sm font-medium text-white">Path Coverage</h4>
                                        </div>
                                        <div className="text-2xl font-bold text-neon-emerald mb-1">3</div>
                                        <p className="text-[10px] text-gray-500">paths with wildcards</p>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="glass-card p-4 rounded-xl"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle className="w-4 h-4 text-vault-gold" />
                                            <h4 className="text-sm font-medium text-white">Security Score</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-2xl font-bold text-vault-gold">A</div>
                                            <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                                                <div className="h-full w-[85%] bg-gradient-to-r from-vault-gold to-neon-emerald rounded-full" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Least privilege compliant</p>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </VaultShell>
    );
}
