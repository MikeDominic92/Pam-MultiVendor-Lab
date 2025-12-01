'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { VaultCard } from '@/components/ui/VaultCard';
import { LeaseTimer } from '@/components/ui/LeaseTimer';
import { SecretField } from '@/components/ui/SecretField';
import { Database, Cloud, RefreshCw, Clock, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DynamicCredentials() {
    const [generating, setGenerating] = useState(false);
    const [generatedCreds, setGeneratedCreds] = useState<{ user: string; pass: string } | null>(null);
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

    return (
        <VaultShell>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-ghost-white mb-2">Dynamic Credentials</h1>
                        <p className="text-slate-gray">Generate short-lived, just-in-time access tokens.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Generator Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <VaultCard title="Credential Generator" icon={RefreshCw}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-slate-gray uppercase tracking-wider mb-2">Backend Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-vault-gold/10 border border-vault-gold/30 text-vault-gold transition-all">
                                            <Database className="w-6 h-6" />
                                            <span className="text-sm font-bold">Database</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 text-slate-gray hover:bg-white/10 hover:text-ghost-white transition-all">
                                            <Cloud className="w-6 h-6" />
                                            <span className="text-sm font-bold">AWS IAM</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-gray uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-ghost-white focus:outline-none focus:border-vault-gold/30"
                                    >
                                        <option value="read-only">read-only</option>
                                        <option value="read-write">read-write</option>
                                        <option value="admin">admin (requires approval)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-gray uppercase tracking-wider mb-2">Lease Duration</label>
                                    <div className="flex gap-2">
                                        {['15m', '1h', '4h', '24h'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTtl(t)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-mono border transition-all ${ttl === t
                                                        ? 'bg-vault-gold/10 border-vault-gold/30 text-vault-gold'
                                                        : 'bg-white/5 border-white/10 text-slate-gray hover:bg-white/10'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="w-full py-3 bg-vault-gold hover:bg-amber-400 text-obsidian-black font-bold rounded-lg transition-all shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {generating ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Generate Credentials
                                        </>
                                    )}
                                </button>
                            </div>
                        </VaultCard>

                        <AnimatePresence>
                            {generatedCreds && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <VaultCard className="border-emerald-success/30 bg-emerald-success/5">
                                        <div className="flex items-center gap-2 mb-4 text-emerald-success">
                                            <CheckCircle className="w-5 h-5" />
                                            <h3 className="font-bold">Credentials Generated</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <SecretField label="Username" value={generatedCreds.user} />
                                            <SecretField label="Password" value={generatedCreds.pass} />
                                            <div className="flex items-center gap-2 text-xs text-emerald-400/80 mt-2">
                                                <Clock className="w-3 h-3" />
                                                <span>Valid for {ttl}</span>
                                            </div>
                                        </div>
                                    </VaultCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Active Leases */}
                    <div className="lg:col-span-2">
                        <VaultCard title="Active Leases" icon={Clock}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-gray font-medium uppercase tracking-wider text-xs">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Lease ID</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Expires In</th>
                                            <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[
                                            { id: 'db/creds/read-only/h8d9...', role: 'read-only', type: 'database', expires: new Date(Date.now() + 1000 * 60 * 45) },
                                            { id: 'aws/creds/deployer/k92m...', role: 'deployer', type: 'aws', expires: new Date(Date.now() + 1000 * 60 * 12) },
                                            { id: 'pki/issue/web-cert/m29x...', role: 'web-cert', type: 'pki', expires: new Date(Date.now() + 1000 * 60 * 2) },
                                            { id: 'db/creds/admin/p02l...', role: 'admin', type: 'database', expires: new Date(Date.now() + 1000 * 60 * 115) },
                                        ].map((lease) => (
                                            <tr key={lease.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-ghost-white">{lease.id}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-medium text-slate-gray">
                                                        {lease.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-gray capitalize">{lease.type}</td>
                                                <td className="px-4 py-3">
                                                    <LeaseTimer expiresAt={lease.expires} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button className="p-2 rounded-lg hover:bg-ruby-danger/10 text-slate-gray hover:text-ruby-danger transition-colors" title="Revoke Lease">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </VaultCard>

                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                                <h4 className="text-blue-400 font-bold mb-1">Total Active</h4>
                                <p className="text-2xl font-mono text-ghost-white">24</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                                <h4 className="text-amber-400 font-bold mb-1">Expiring Soon</h4>
                                <p className="text-2xl font-mono text-ghost-white">3</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                                <h4 className="text-emerald-400 font-bold mb-1">Rotated (24h)</h4>
                                <p className="text-2xl font-mono text-ghost-white">156</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VaultShell>
    );
}
