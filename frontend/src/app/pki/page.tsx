'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { VaultCard } from '@/components/ui/VaultCard';
import { ShieldCheck, Shield, Award, Calendar, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PKIAuthority() {
    const [commonName, setCommonName] = useState('');
    const [issuing, setIssuing] = useState(false);
    const [issuedCert, setIssuedCert] = useState(false);

    const handleIssue = () => {
        setIssuing(true);
        setTimeout(() => {
            setIssuing(false);
            setIssuedCert(true);
        }, 2000);
    };

    return (
        <VaultShell>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-ghost-white mb-2">PKI Authority</h1>
                        <p className="text-slate-gray">Manage internal Certificate Authorities and issue certificates.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-success/10 border border-emerald-success/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-success" />
                            <span className="text-xs font-medium text-emerald-success">Root CA Active</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Issuance Wizard */}
                    <div className="lg:col-span-4 space-y-6">
                        <VaultCard title="Issue Certificate" icon={Award}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-gray uppercase tracking-wider mb-2">Role</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-ghost-white focus:outline-none focus:border-vault-gold/30">
                                        <option>web-server</option>
                                        <option>internal-service</option>
                                        <option>client-auth</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-gray uppercase tracking-wider mb-2">Common Name</label>
                                    <input
                                        type="text"
                                        value={commonName}
                                        onChange={(e) => setCommonName(e.target.value)}
                                        placeholder="e.g. api.internal.corp"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-ghost-white focus:outline-none focus:border-vault-gold/30 placeholder:text-slate-gray/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-gray uppercase tracking-wider mb-2">TTL</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['24h', '7d', '30d'].map((t) => (
                                            <button key={t} className="py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-gray hover:bg-white/10 hover:text-ghost-white transition-colors">
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleIssue}
                                    disabled={issuing || !commonName}
                                    className="w-full py-3 mt-4 bg-vault-gold hover:bg-amber-400 text-obsidian-black font-bold rounded-lg transition-all shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {issuing ? (
                                        <>
                                            <ShieldCheck className="w-4 h-4 animate-spin" />
                                            Signing...
                                        </>
                                    ) : (
                                        <>
                                            <Award className="w-4 h-4" />
                                            Issue Certificate
                                        </>
                                    )}
                                </button>
                            </div>
                        </VaultCard>

                        {issuedCert && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-emerald-success/10 border border-emerald-success/20"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-success" />
                                    <span className="font-bold text-emerald-success">Certificate Issued</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                        <span className="text-xs text-slate-gray">Serial</span>
                                        <span className="text-xs font-mono text-ghost-white">72:41:9a:f3...</span>
                                    </div>
                                    <button className="w-full py-2 flex items-center justify-center gap-2 bg-emerald-success/20 hover:bg-emerald-success/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium">
                                        <Download className="w-4 h-4" />
                                        Download Bundle
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Chain Visualizer */}
                    <div className="lg:col-span-8 space-y-6">
                        <VaultCard title="Certificate Chain Hierarchy" icon={Shield}>
                            <div className="relative p-8 min-h-[400px] flex flex-col items-center justify-center">
                                {/* Root CA */}
                                <div className="relative z-10 flex flex-col items-center group">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vault-gold to-amber-600 p-[2px] shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                                        <div className="w-full h-full rounded-2xl bg-obsidian-black flex items-center justify-center">
                                            <ShieldCheck className="w-8 h-8 text-vault-gold" />
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <p className="font-bold text-ghost-white">Root CA G1</p>
                                        <p className="text-xs text-slate-gray">Expires 2035</p>
                                    </div>

                                    {/* Connection Line */}
                                    <div className="absolute top-full left-1/2 w-px h-16 bg-gradient-to-b from-vault-gold/50 to-transparent" />
                                </div>

                                {/* Intermediate CAs */}
                                <div className="mt-16 grid grid-cols-2 gap-32 relative z-10">
                                    <div className="flex flex-col items-center group">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:border-vault-gold/50 transition-colors">
                                            <Shield className="w-6 h-6 text-slate-gray group-hover:text-vault-gold transition-colors" />
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="font-medium text-sm text-ghost-white">Interm. Web</p>
                                            <p className="text-[10px] text-slate-gray">Expires 2028</p>
                                        </div>
                                        <div className="absolute top-full left-1/2 w-px h-12 bg-white/10" />
                                    </div>

                                    <div className="flex flex-col items-center group">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:border-vault-gold/50 transition-colors">
                                            <Shield className="w-6 h-6 text-slate-gray group-hover:text-vault-gold transition-colors" />
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="font-medium text-sm text-ghost-white">Interm. Ops</p>
                                            <p className="text-[10px] text-slate-gray">Expires 2028</p>
                                        </div>
                                        <div className="absolute top-full left-1/2 w-px h-12 bg-white/10" />
                                    </div>
                                </div>

                                {/* Leaf Certs */}
                                <div className="mt-12 grid grid-cols-4 gap-8 w-full px-8">
                                    {['api.prod', 'web.prod', 'db.internal', 'worker.ops'].map((leaf, i) => (
                                        <div key={leaf} className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-emerald-success mb-2" />
                                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-gray">
                                                {leaf}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl" />
                            </div>
                        </VaultCard>

                        <div className="grid grid-cols-2 gap-6">
                            <VaultCard title="Expiring Soon (7 Days)" icon={Calendar}>
                                <div className="space-y-3">
                                    {[
                                        { name: 'legacy-api.internal', days: 2 },
                                        { name: 'dev-db-01.corp', days: 5 },
                                    ].map((cert) => (
                                        <div key={cert.name} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                <span className="text-sm font-mono text-ghost-white">{cert.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-amber-500">{cert.days} days</span>
                                        </div>
                                    ))}
                                </div>
                            </VaultCard>

                            <VaultCard title="Revocation Status" icon={AlertTriangle}>
                                <div className="flex items-center justify-between h-full">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-ghost-white">12</p>
                                        <p className="text-xs text-slate-gray uppercase tracking-wider">Revoked</p>
                                    </div>
                                    <div className="h-8 w-px bg-white/10" />
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-success">Healthy</p>
                                        <p className="text-xs text-slate-gray uppercase tracking-wider">CRL Status</p>
                                    </div>
                                    <div className="h-8 w-px bg-white/10" />
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-success">Online</p>
                                        <p className="text-xs text-slate-gray uppercase tracking-wider">OCSP</p>
                                    </div>
                                </div>
                            </VaultCard>
                        </div>
                    </div>
                </div>
            </div>
        </VaultShell>
    );
}
