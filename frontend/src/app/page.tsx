'use client';

import React from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { VaultCard } from '@/components/ui/VaultCard';
import { LeaseTimer } from '@/components/ui/LeaseTimer';
import { VaultDoor } from '@/components/dashboard/VaultDoor';
import { Database, Key, Shield, Server, Activity, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const data = [
  { name: '00:00', requests: 400 },
  { name: '04:00', requests: 300 },
  { name: '08:00', requests: 550 },
  { name: '12:00', requests: 900 },
  { name: '16:00', requests: 800 },
  { name: '20:00', requests: 600 },
  { name: '24:00', requests: 450 },
];

export default function Dashboard() {
  return (
    <VaultShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ghost-white mb-2">Vault Status</h1>
            <p className="text-slate-gray">Cluster health and secret engine metrics.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-success/10 border border-emerald-success/20">
              <div className="w-2 h-2 rounded-full bg-emerald-success animate-pulse" />
              <span className="text-xs font-medium text-emerald-success">Cluster Healthy</span>
            </div>
            <span className="text-xs text-slate-gray font-mono">Uptime: 14d 2h 12m</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Central Vault Viz */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-b from-vault-surface to-black border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <VaultDoor status="unlocked" />
            <div className="mt-8 text-center relative z-10">
              <h2 className="text-2xl font-bold text-ghost-white">Vault Unsealed</h2>
              <p className="text-sm text-slate-gray mt-1">3/5 Unseal Keys Provided</p>
            </div>
          </div>

          {/* Metrics & Engines */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <VaultCard title="Secrets Engines" icon={Key}>
              <div className="space-y-4">
                {[
                  { name: 'kv-v2', type: 'Key/Value', status: 'active', icon: Key },
                  { name: 'pki', type: 'PKI', status: 'active', icon: Shield },
                  { name: 'database', type: 'Database', status: 'active', icon: Database },
                  { name: 'transit', type: 'Transit', status: 'active', icon: Server },
                ].map((engine) => (
                  <div key={engine.name} className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <engine.icon className="w-4 h-4 text-slate-gray group-hover:text-vault-gold transition-colors" />
                      <div>
                        <p className="text-sm font-medium text-ghost-white">{engine.name}</p>
                        <p className="text-xs text-slate-gray">{engine.type}</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-success" />
                  </div>
                ))}
              </div>
            </VaultCard>

            <VaultCard title="Active Leases" icon={Activity}>
              <div className="space-y-4">
                {[
                  { id: 'db-creds-01', type: 'database', expires: new Date(Date.now() + 1000 * 60 * 45) }, // 45 mins
                  { id: 'aws-role-dev', type: 'aws', expires: new Date(Date.now() + 1000 * 60 * 15) }, // 15 mins
                  { id: 'pki-cert-web', type: 'pki', expires: new Date(Date.now() + 1000 * 60 * 2) }, // 2 mins
                ].map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                    <div>
                      <p className="text-sm font-medium text-ghost-white font-mono">{lease.id}</p>
                      <p className="text-xs text-slate-gray uppercase">{lease.type}</p>
                    </div>
                    <LeaseTimer expiresAt={lease.expires} />
                  </div>
                ))}
              </div>
            </VaultCard>
          </div>
        </div>

        {/* Request Volume Chart */}
        <VaultCard title="Request Volume (24h)" icon={Activity} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#FFD700' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#FFD700" fillOpacity={1} fill="url(#colorRequests)" />
            </AreaChart>
          </ResponsiveContainer>
        </VaultCard>

        {/* Recent Audit Log */}
        <div className="grid grid-cols-1 gap-4">
          <h3 className="text-lg font-bold text-ghost-white">Recent Audit Events</h3>
          <div className="bg-vault-surface border border-white/5 rounded-xl overflow-hidden">
            {[
              { time: '10:42:15', type: 'read', path: 'secret/data/app-config', actor: 'web-service', status: 'success' },
              { time: '10:41:03', type: 'update', path: 'sys/policy/admin', actor: 'sys-admin', status: 'success' },
              { time: '10:38:55', type: 'delete', path: 'secret/data/legacy-creds', actor: 'sys-admin', status: 'success' },
              { time: '10:35:12', type: 'read', path: 'secret/data/prod-db', actor: 'unknown', status: 'denied' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-slate-gray">{log.time}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border",
                    log.type === 'read' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    log.type === 'update' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    log.type === 'delete' && "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>{log.type}</span>
                  <span className="text-sm font-mono text-ghost-white">{log.path}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-gray">Actor:</span>
                    <span className="text-sm text-vault-gold">{log.actor}</span>
                  </div>
                  {log.status === 'denied' && <AlertTriangle className="w-4 h-4 text-ruby-danger" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VaultShell>
  );
}
