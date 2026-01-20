'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { GlassButton } from '@/components/ui/GlassButton';
import { NeonBadge } from '@/components/ui/NeonBadge';
import { ShieldCheck, Shield, Award, Calendar, Download, AlertTriangle, CheckCircle, Clock, Server, Lock, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PKIAuthority() {
    const [commonName, setCommonName] = useState('');
    const [selectedRole, setSelectedRole] = useState('web-server');
    const [selectedTtl, setSelectedTtl] = useState('7d');
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1 font-orbitron">
                            PKI <span className="text-cyber-cyan">Authority</span>
                        </h1>
                        <p className="text-sm text-gray-500">Manage Certificate Authorities and issue certificates</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <NeonBadge variant="emerald" pulse icon={<ShieldCheck className="w-3 h-3" />}>
                            Root CA Active
                        </NeonBadge>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Active Certs', value: '1,247', icon: Award, color: 'cyan' },
                        { label: 'Expiring (7d)', value: '12', icon: Clock, color: 'gold' },
                        { label: 'Revoked', value: '34', icon: AlertTriangle, color: 'pink' },
                        { label: 'Issued (24h)', value: '89', icon: CheckCircle, color: 'emerald' },
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
                                    stat.color === 'pink' && "bg-plasma-pink/10 text-plasma-pink",
                                    stat.color === 'emerald' && "bg-neon-emerald/10 text-neon-emerald",
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
                    {/* Issuance Wizard */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center">
                                    <Award className="w-5 h-5 text-cyber-purple" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Issue Certificate</h3>
                                    <p className="text-xs text-gray-500">Generate new X.509 certificate</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Role Selection */}
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-2">Certificate Role</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'web-server', name: 'Web Server', desc: 'TLS/SSL for HTTPS' },
                                            { id: 'internal-service', name: 'Internal Service', desc: 'mTLS for microservices' },
                                            { id: 'client-auth', name: 'Client Auth', desc: 'User certificates' },
                                        ].map((role) => (
                                            <motion.button
                                                key={role.id}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => setSelectedRole(role.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                                    selectedRole === role.id
                                                        ? "bg-cyber-purple/10 border-cyber-purple/30"
                                                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                                                )}
                                            >
                                                <div>
                                                    <span className={cn(
                                                        "text-sm font-medium",
                                                        selectedRole === role.id ? "text-cyber-purple" : "text-gray-400"
                                                    )}>{role.name}</span>
                                                    <p className="text-[10px] text-gray-600">{role.desc}</p>
                                                </div>
                                                {selectedRole === role.id && (
                                                    <div className="w-2 h-2 rounded-full bg-cyber-purple shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Common Name */}
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-2">Common Name (CN)</label>
                                    <input
                                        type="text"
                                        value={commonName}
                                        onChange={(e) => setCommonName(e.target.value)}
                                        placeholder="e.g. api.internal.corp"
                                        className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-purple/30 transition-all placeholder:text-gray-600"
                                    />
                                </div>

                                {/* TTL */}
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase tracking-wider mb-2">Validity Period</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['24h', '7d', '30d'].map((t) => (
                                            <motion.button
                                                key={t}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedTtl(t)}
                                                className={cn(
                                                    "py-2.5 rounded-xl text-sm font-mono border transition-all",
                                                    selectedTtl === t
                                                        ? "bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple"
                                                        : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:bg-white/[0.04]"
                                                )}
                                            >
                                                {t}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Issue Button */}
                                <GlassButton
                                    onClick={handleIssue}
                                    disabled={issuing || !commonName}
                                    loading={issuing}
                                    variant="secondary"
                                    glow
                                    className="w-full py-3"
                                    icon={issuing ? undefined : <Award className="w-4 h-4" />}
                                >
                                    {issuing ? 'Signing...' : 'Issue Certificate'}
                                </GlassButton>
                            </div>
                        </div>

                        {/* Issued Certificate */}
                        <AnimatePresence>
                            {issuedCert && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="glass-card p-5 rounded-2xl border-neon-emerald/20 bg-neon-emerald/5"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-5 h-5 text-neon-emerald" />
                                        <h3 className="font-semibold text-neon-emerald">Certificate Issued</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
                                            <span className="text-xs text-gray-500">Serial</span>
                                            <span className="text-xs font-mono text-white">72:41:9a:f3:...</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
                                            <span className="text-xs text-gray-500">Expires</span>
                                            <span className="text-xs font-mono text-white">{selectedTtl}</span>
                                        </div>
                                        <GlassButton
                                            variant="ghost"
                                            icon={<Download className="w-4 h-4" />}
                                            className="w-full"
                                        >
                                            Download Bundle
                                        </GlassButton>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Certificate Chain Visualization */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="glass-card p-5 rounded-2xl">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-vault-gold/10 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-vault-gold" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Certificate Chain Hierarchy</h3>
                                    <p className="text-xs text-gray-500">Trust chain visualization</p>
                                </div>
                            </div>

                            <div className="relative py-8 min-h-[350px] flex flex-col items-center">
                                {/* Root CA */}
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative z-10 flex flex-col items-center group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vault-gold to-amber-600 p-[2px] shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                        <div className="w-full h-full rounded-2xl bg-void flex items-center justify-center">
                                            <ShieldCheck className="w-8 h-8 text-vault-gold" />
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <p className="font-bold text-white">Root CA G1</p>
                                        <p className="text-[10px] text-gray-500">Expires 2035</p>
                                        <NeonBadge variant="gold" size="sm" className="mt-2">Self-Signed</NeonBadge>
                                    </div>

                                    {/* Connection Line */}
                                    <div className="absolute top-full left-1/2 w-px h-12 bg-gradient-to-b from-vault-gold/50 to-white/10" />
                                </motion.div>

                                {/* Intermediate CAs */}
                                <div className="mt-16 grid grid-cols-2 gap-24 relative z-10">
                                    {[
                                        { name: 'Intermediate Web', expires: '2028' },
                                        { name: 'Intermediate Ops', expires: '2028' },
                                    ].map((ca, i) => (
                                        <motion.div
                                            key={ca.name}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + i * 0.1 }}
                                            className="flex flex-col items-center group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:border-cyber-cyan/30 group-hover:bg-cyber-cyan/5 transition-all">
                                                <Shield className="w-6 h-6 text-gray-500 group-hover:text-cyber-cyan transition-colors" />
                                            </div>
                                            <div className="mt-2 text-center">
                                                <p className="font-medium text-sm text-white">{ca.name}</p>
                                                <p className="text-[10px] text-gray-600">Expires {ca.expires}</p>
                                            </div>
                                            <div className="absolute top-full left-1/2 w-px h-8 bg-white/10" />
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Leaf Certificates */}
                                <div className="mt-12 grid grid-cols-4 gap-6 w-full px-4">
                                    {['api.prod', 'web.prod', 'db.internal', 'worker.ops'].map((leaf, i) => (
                                        <motion.div
                                            key={leaf}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.05 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-neon-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)] mb-2" />
                                            <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono text-gray-400 hover:text-white hover:border-cyber-cyan/20 transition-all cursor-pointer">
                                                {leaf}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Background decorative grid */}
                                <div
                                    className="absolute inset-0 opacity-[0.02]"
                                    style={{
                                        backgroundImage: `linear-gradient(rgba(0,245,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.2) 1px, transparent 1px)`,
                                        backgroundSize: '40px 40px',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Bottom Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Expiring Soon */}
                            <div className="glass-card p-5 rounded-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-vault-gold/10 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-vault-gold" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-white">Expiring Soon</h4>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { name: 'legacy-api.internal', days: 2 },
                                        { name: 'dev-db-01.corp', days: 5 },
                                    ].map((cert) => (
                                        <div key={cert.name} className="flex items-center justify-between p-3 rounded-xl bg-vault-gold/5 border border-vault-gold/10">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className="w-4 h-4 text-vault-gold" />
                                                <span className="text-xs font-mono text-white">{cert.name}</span>
                                            </div>
                                            <NeonBadge variant="gold" size="sm">{cert.days}d</NeonBadge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Revocation Status */}
                            <div className="glass-card p-5 rounded-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-cyber-cyan" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-white">Revocation Status</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-xl bg-black/20">
                                        <p className="text-xl font-bold text-white">12</p>
                                        <p className="text-[10px] text-gray-500">Revoked</p>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-neon-emerald/10 border border-neon-emerald/20">
                                        <p className="text-lg font-bold text-neon-emerald">Healthy</p>
                                        <p className="text-[10px] text-gray-500">CRL Status</p>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-neon-emerald/10 border border-neon-emerald/20">
                                        <p className="text-lg font-bold text-neon-emerald">Online</p>
                                        <p className="text-[10px] text-gray-500">OCSP</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </VaultShell>
    );
}
