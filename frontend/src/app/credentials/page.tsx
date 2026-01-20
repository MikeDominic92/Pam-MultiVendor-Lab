'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { LeaseTimer } from '@/components/ui/LeaseTimer';
import { SecretField } from '@/components/ui/SecretField';
import { GlassButton } from '@/components/ui/GlassButton';
import { NeonBadge } from '@/components/ui/NeonBadge';
import { Database, Cloud, RefreshCw, Clock, Trash2, CheckCircle, Zap, Shield, Server, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DynamicCredentials() {
    const [generating, setGenerating] = useState(false);
    const [generatedCreds, setGeneratedCreds] = useState<{ user: string; pass: string } | null>(null);
    const [selectedBackend, setSelectedBackend] = useState<'database' | 'aws'>('database');
    const [selectedRole, setSelectedRole] = useState('read-only');
    const [ttl, setTtl] = useState('1h');

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setGeneratedCreds({
                user: `v-token-${Math.random().toString(36).substring(7)}`,
                pass: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2).toUpperCase() + '!'
            });
            setGenerating(false);
        }, 1500);
    };

    const backends = [
        { id: 'database', name: 'Database', icon: Database, color: 'cyan', description: 'PostgreSQL, MySQL, MSSQL' },
        { id: 'aws', name: 'AWS IAM', icon: Cloud, color: 'gold', description: 'STS Assume Role' },
    ];

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
                            Dynamic <span className="text-cyber-cyan">Credentials</span>
                        </h1>
                        <p className="text-sm text-gray-500">Generate short-lived, just-in-time access tokens</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <NeonBadge variant="emerald" pulse>Auto-Rotation Active</NeonBadge>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Active Leases', value: '24', icon: Zap, color: 'cyan' },
                        { label: 'Expiring Soon', value: '3', icon: Clock, color: 'gold' },
                        { label: 'Rotated (24h)', value: '156', icon: RefreshCw, color: 'emerald' },
                        { label: 'Avg TTL', value: '2.4h', icon: TrendingUp, color: 'purple' },
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="glass-card p-4 rounded-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    stat.color === 'cyan' && "bg-cyber-cyan/10 text-cyber-cyan",
                                    stat.color === 'gold' && "bg-vault-gold/10 text-vault-gold",
                                    stat.color === 'emerald' && "bg-neon-emerald/10 text-neon-emerald",
                                    stat.color === 'purple' && "bg-cyber-purple/10 text-cyber-purple",
                                )}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{stat.value}</p>
                                    <p className="text-[10px] text-gray-500">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Generator Panel */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                                    <RefreshCw className="w-5 h-5 text-cyber-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Credential Generator</h3>
                                    <p className="text-xs text-gray-500">Create new dynamic credentials</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Backend Selection */}
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-2">Backend Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {backends.map((backend) => (
                                            <motion.button
                                                key={backend.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedBackend(backend.id as 'database' | 'aws')}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                                    selectedBackend === backend.id
                                                        ? backend.color === 'cyan'
                                                            ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan"
                                                            : "bg-vault-gold/10 border-vault-gold/30 text-vault-gold"
                                                        : "bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]"
                                                )}
                                            >
                                                <backend.icon className="w-6 h-6" />
                                                <span className="text-sm font-medium">{backend.name}</span>
                                                <span className="text-[10px] opacity-60">{backend.description}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-cyan/30 transition-all"
                                    >
                                        <option value="read-only">read-only</option>
                                        <option value="read-write">read-write</option>
                                        <option value="admin">admin (requires approval)</option>
                                    </select>
                                </div>

                                {/* TTL Selection */}
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-2">Lease Duration</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['15m', '1h', '4h', '24h'].map((t) => (
                                            <motion.button
                                                key={t}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setTtl(t)}
                                                className={cn(
                                                    "py-2.5 rounded-xl text-sm font-mono border transition-all",
                                                    ttl === t
                                                        ? "bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan"
                                                        : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:bg-white/[0.04]"
                                                )}
                                            >
                                                {t}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <GlassButton
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    loading={generating}
                                    glow
                                    className="w-full py-3"
                                    icon={generating ? undefined : <CheckCircle className="w-4 h-4" />}
                                >
                                    {generating ? 'Generating...' : 'Generate Credentials'}
                                </GlassButton>
                            </div>
                        </div>

                        {/* Generated Credentials */}
                        <AnimatePresence>
                            {generatedCreds && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="glass-card p-5 rounded-2xl border-neon-emerald/20 bg-neon-emerald/5"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-5 h-5 text-neon-emerald" />
                                        <h3 className="font-semibold text-neon-emerald">Credentials Generated</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <SecretField label="Username" value={generatedCreds.user} />
                                        <SecretField label="Password" value={generatedCreds.pass} />
                                        <div className="flex items-center gap-2 text-xs text-neon-emerald/70 pt-2">
                                            <Clock className="w-3 h-3" />
                                            <span>Valid for {ttl}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Active Leases Table */}
                    <div className="lg:col-span-8">
                        <div className="glass-card rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-white/[0.04]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-cyber-purple" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Active Leases</h3>
                                        <p className="text-xs text-gray-500">Currently issued dynamic credentials</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/20 text-gray-500 font-medium uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="px-5 py-4">Lease ID</th>
                                            <th className="px-5 py-4">Role</th>
                                            <th className="px-5 py-4">Type</th>
                                            <th className="px-5 py-4">Expires In</th>
                                            <th className="px-5 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                        {[
                                            { id: 'db/creds/read-only/h8d9...', role: 'read-only', type: 'database', expires: new Date(Date.now() + 1000 * 60 * 45), platform: 'delinea' },
                                            { id: 'aws/creds/deployer/k92m...', role: 'deployer', type: 'aws', expires: new Date(Date.now() + 1000 * 60 * 12), platform: 'aws' },
                                            { id: 'pki/issue/web-cert/m29x...', role: 'web-cert', type: 'pki', expires: new Date(Date.now() + 1000 * 60 * 2), platform: 'vault' },
                                            { id: 'db/creds/admin/p02l...', role: 'admin', type: 'database', expires: new Date(Date.now() + 1000 * 60 * 115), platform: 'delinea' },
                                        ].map((lease, i) => (
                                            <motion.tr
                                                key={lease.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="group hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-5 py-4 font-mono text-xs text-white">{lease.id}</td>
                                                <td className="px-5 py-4">
                                                    <NeonBadge
                                                        variant={lease.role === 'admin' ? 'gold' : 'cyan'}
                                                        size="sm"
                                                    >
                                                        {lease.role}
                                                    </NeonBadge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {lease.type === 'database' && <Database className="w-3.5 h-3.5 text-cyber-cyan" />}
                                                        {lease.type === 'aws' && <Cloud className="w-3.5 h-3.5 text-yellow-400" />}
                                                        {lease.type === 'pki' && <Shield className="w-3.5 h-3.5 text-cyber-purple" />}
                                                        <span className="text-gray-400 capitalize">{lease.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <LeaseTimer expiresAt={lease.expires} />
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="p-2 rounded-lg hover:bg-plasma-pink/10 text-gray-500 hover:text-plasma-pink transition-colors"
                                                        title="Revoke Lease"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </VaultShell>
    );
}
