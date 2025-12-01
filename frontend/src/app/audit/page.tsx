'use client';

import React, { useState } from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { VaultCard } from '@/components/ui/VaultCard';
import { PolicyBadge } from '@/components/ui/PolicyBadge';
import { FileText, Shield, Search, Filter, Code, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const policies = [
    { name: 'admin-policy', type: 'acl' },
    { name: 'app-read-only', type: 'acl' },
    { name: 'pki-issuer', type: 'acl' },
    { name: 'db-creds-rotator', type: 'acl' },
];

const initialPolicyContent = `path "secret/data/app-config" {
  capabilities = ["read"]
}

path "sys/mounts" {
  capabilities = ["read", "list"]
}

path "pki/issue/*" {
  capabilities = ["create", "update"]
}`;

export default function AuditPolicies() {
    const [activeTab, setActiveTab] = useState<'audit' | 'policies'>('audit');
    const [selectedPolicy, setSelectedPolicy] = useState('app-read-only');
    const [policyContent, setPolicyContent] = useState(initialPolicyContent);

    return (
        <VaultShell>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-ghost-white mb-2">Audit & Policies</h1>
                        <p className="text-slate-gray">Monitor access logs and manage ACL policies.</p>
                    </div>
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === 'audit' ? "bg-vault-gold text-obsidian-black shadow-gold-glow" : "text-slate-gray hover:text-ghost-white"
                            )}
                        >
                            Audit Log
                        </button>
                        <button
                            onClick={() => setActiveTab('policies')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === 'policies' ? "bg-vault-gold text-obsidian-black shadow-gold-glow" : "text-slate-gray hover:text-ghost-white"
                            )}
                        >
                            Policies
                        </button>
                    </div>
                </div>

                {activeTab === 'audit' ? (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-gray" />
                                <input
                                    type="text"
                                    placeholder="Search by request ID, path, or actor..."
                                    className="w-full bg-vault-surface border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-ghost-white focus:outline-none focus:border-vault-gold/30"
                                />
                            </div>
                            <button className="px-4 py-2 bg-vault-surface border border-white/5 rounded-lg text-slate-gray hover:text-ghost-white flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                        </div>

                        {/* Log Stream */}
                        <div className="bg-vault-surface border border-white/5 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-black/20 text-xs font-bold text-slate-gray uppercase tracking-wider">
                                <div className="col-span-2">Time</div>
                                <div className="col-span-1">Type</div>
                                <div className="col-span-4">Path</div>
                                <div className="col-span-3">Actor</div>
                                <div className="col-span-2 text-right">Status</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {[
                                    { time: '2023-10-27 10:42:15', type: 'read', path: 'secret/data/app-config', actor: 'web-service', status: 'success' },
                                    { time: '2023-10-27 10:41:03', type: 'update', path: 'sys/policy/admin', actor: 'sys-admin', status: 'success' },
                                    { time: '2023-10-27 10:38:55', type: 'delete', path: 'secret/data/legacy-creds', actor: 'sys-admin', status: 'success' },
                                    { time: '2023-10-27 10:35:12', type: 'read', path: 'secret/data/prod-db', actor: 'unknown', status: 'denied' },
                                    { time: '2023-10-27 10:30:00', type: 'list', path: 'pki/roles', actor: 'deploy-bot', status: 'success' },
                                    { time: '2023-10-27 10:28:45', type: 'create', path: 'auth/token/create', actor: 'auth-service', status: 'success' },
                                ].map((log, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors items-center text-sm">
                                        <div className="col-span-2 font-mono text-slate-gray text-xs">{log.time}</div>
                                        <div className="col-span-1">
                                            <PolicyBadge capability={log.type as any} />
                                        </div>
                                        <div className="col-span-4 font-mono text-ghost-white truncate" title={log.path}>{log.path}</div>
                                        <div className="col-span-3 text-vault-gold">{log.actor}</div>
                                        <div className="col-span-2 text-right">
                                            <span className={cn(
                                                "text-xs font-bold uppercase",
                                                log.status === 'success' ? "text-emerald-success" : "text-ruby-danger"
                                            )}>
                                                {log.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-8 h-[600px]">
                        {/* Policy List */}
                        <div className="col-span-3 bg-vault-surface border border-white/5 rounded-xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/5">
                                <h3 className="text-xs font-bold text-slate-gray uppercase tracking-wider">ACL Policies</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {policies.map((policy) => (
                                    <button
                                        key={policy.name}
                                        onClick={() => setSelectedPolicy(policy.name)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                            selectedPolicy === policy.name
                                                ? "bg-vault-gold/10 text-vault-gold border border-vault-gold/20"
                                                : "text-slate-gray hover:bg-white/5 hover:text-ghost-white"
                                        )}
                                    >
                                        <Shield className="w-4 h-4" />
                                        {policy.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Policy Editor */}
                        <div className="col-span-9 flex flex-col gap-4">
                            <VaultCard className="flex-1 flex flex-col p-0 overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
                                    <div className="flex items-center gap-2">
                                        <Code className="w-4 h-4 text-vault-gold" />
                                        <span className="font-mono text-sm text-ghost-white">{selectedPolicy}.hcl</span>
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-success/10 hover:bg-emerald-success/20 text-emerald-success rounded-lg transition-colors text-xs font-bold uppercase tracking-wider border border-emerald-success/20">
                                        <Check className="w-3 h-3" />
                                        Save Policy
                                    </button>
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={policyContent}
                                        onChange={(e) => setPolicyContent(e.target.value)}
                                        className="absolute inset-0 w-full h-full bg-obsidian-black p-4 font-mono text-sm text-ghost-white resize-none focus:outline-none"
                                        spellCheck={false}
                                    />
                                </div>
                            </VaultCard>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <h4 className="text-blue-400 font-bold text-sm mb-1">Path Matching</h4>
                                    <p className="text-xs text-slate-gray">Policy applies to paths starting with <span className="font-mono text-ghost-white">secret/data/</span></p>
                                </div>
                                <div className="p-4 rounded-xl bg-vault-gold/5 border border-vault-gold/10">
                                    <h4 className="text-vault-gold font-bold text-sm mb-1">Capabilities</h4>
                                    <div className="flex gap-2 mt-2">
                                        <PolicyBadge capability="read" />
                                        <PolicyBadge capability="list" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </VaultShell>
    );
}
