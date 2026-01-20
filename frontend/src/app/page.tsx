'use client';

import React from 'react';
import { VaultShell } from '@/components/layout/VaultShell';
import { VaultCard } from '@/components/ui/VaultCard';
import { LeaseTimer } from '@/components/ui/LeaseTimer';
import { VaultDoor } from '@/components/dashboard/VaultDoor';
import { Sparkline, ProgressRing, BarItem, ChartGradientDefs, GlassTooltip, chartColors } from '@/components/ui/ChartTheme';
import { Database, Key, Shield, Server, Activity, AlertTriangle, TrendingUp, Users, Clock, Zap, ArrowUpRight, ArrowDownRight, Lock, Globe, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const chartData = [
  { name: '00:00', requests: 400, errors: 12 },
  { name: '04:00', requests: 300, errors: 8 },
  { name: '08:00', requests: 550, errors: 15 },
  { name: '12:00', requests: 900, errors: 22 },
  { name: '16:00', requests: 800, errors: 18 },
  { name: '20:00', requests: 600, errors: 10 },
  { name: '24:00', requests: 450, errors: 7 },
];

const platformDistribution = [
  { name: 'Delinea', value: 847, color: chartColors.cyan },
  { name: 'AWS', value: 1234, color: chartColors.gold },
  { name: 'Vault', value: 766, color: chartColors.purple },
];

const secretTypes = [
  { label: 'Database', value: 1247, maxValue: 1500 },
  { label: 'API Keys', value: 892, maxValue: 1500 },
  { label: 'SSH Keys', value: 456, maxValue: 1500 },
  { label: 'Certificates', value: 252, maxValue: 1500 },
];

const statCards = [
  { label: 'Total Secrets', value: '2,847', change: '+12.5%', trend: 'up', icon: Key, color: 'cyan' as const, sparkline: [40, 45, 42, 50, 55, 60, 58, 65] },
  { label: 'Active Sessions', value: '156', change: '+8.2%', trend: 'up', icon: Users, color: 'purple' as const, sparkline: [20, 25, 22, 28, 30, 35, 32, 38] },
  { label: 'API Requests', value: '45.2K', change: '-3.1%', trend: 'down', icon: Zap, color: 'emerald' as const, sparkline: [90, 85, 88, 82, 80, 75, 78, 72] },
  { label: 'Avg Response', value: '12ms', change: '-18%', trend: 'up', icon: Clock, color: 'gold' as const, sparkline: [25, 22, 20, 18, 15, 14, 13, 12] },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <VaultShell>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 font-orbitron">
              Security <span className="text-cyber-cyan">Dashboard</span>
            </h1>
            <p className="text-sm text-gray-500">Multi-vendor PAM overview and real-time metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
              <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-medium text-neon-emerald">All Systems Operational</span>
            </div>
            <span className="text-xs text-gray-600 font-mono px-3 py-2 rounded-lg bg-black/20">Uptime: 14d 2h 12m</span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02, y: -2 }}
              className="glass-card-hover p-5 rounded-2xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  stat.color === 'cyan' && "bg-cyber-cyan/10 text-cyber-cyan",
                  stat.color === 'purple' && "bg-cyber-purple/10 text-cyber-purple",
                  stat.color === 'emerald' && "bg-neon-emerald/10 text-neon-emerald",
                  stat.color === 'gold' && "bg-vault-gold/10 text-vault-gold",
                )}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <Sparkline data={stat.sparkline} color={stat.color} width={60} height={20} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
                  stat.trend === 'up' ? "text-neon-emerald bg-neon-emerald/10" : "text-plasma-pink bg-plasma-pink/10"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vault Status */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 via-transparent to-cyber-purple/5" />

            <VaultDoor status="unlocked" />

            <div className="mt-6 text-center relative z-10">
              <h2 className="text-xl font-bold text-white font-orbitron">Vault Unsealed</h2>
              <p className="text-sm text-gray-500 mt-1">3/5 Unseal Keys Provided</p>

              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3, 4, 5].map((key) => (
                  <div
                    key={key}
                    className={cn(
                      "w-3 h-8 rounded-full transition-all",
                      key <= 3
                        ? "bg-cyber-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                        : "bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Platform Cards */}
          <motion.div variants={itemVariants} className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delinea Card */}
            <div className="glass-card-hover p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center border border-orange-500/20">
                    <Shield className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Delinea Secret Server</h3>
                    <p className="text-xs text-gray-500">Enterprise PAM</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse" />
                  <span className="text-[10px] text-neon-emerald font-mono">Connected</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/20">
                  <p className="text-lg font-bold text-white">847</p>
                  <p className="text-[10px] text-gray-500">Secrets</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20">
                  <p className="text-lg font-bold text-white">12</p>
                  <p className="text-[10px] text-gray-500">Folders</p>
                </div>
              </div>
            </div>

            {/* AWS Card */}
            <div className="glass-card-hover p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Server className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">AWS Secrets Manager</h3>
                    <p className="text-xs text-gray-500">Cloud Secrets</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse" />
                  <span className="text-[10px] text-neon-emerald font-mono">Connected</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/20">
                  <p className="text-lg font-bold text-white">1,234</p>
                  <p className="text-[10px] text-gray-500">Secrets</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20">
                  <p className="text-lg font-bold text-white">8</p>
                  <p className="text-[10px] text-gray-500">Regions</p>
                </div>
              </div>
            </div>

            {/* HashiCorp Vault Card */}
            <div className="glass-card-hover p-5 rounded-2xl opacity-60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 flex items-center justify-center border border-gray-500/20">
                    <Database className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">HashiCorp Vault</h3>
                    <p className="text-xs text-gray-600">Not Configured</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-[10px] text-gray-500 font-mono">Offline</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black/20 text-center">
                <p className="text-xs text-gray-500">Connect to enable features</p>
              </div>
            </div>

            {/* Active Leases Card */}
            <div className="glass-card-hover p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20">
                    <Activity className="w-5 h-5 text-cyber-purple" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Active Leases</h3>
                    <p className="text-xs text-gray-500">Dynamic credentials</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'db-creds-01', type: 'database', expires: new Date(Date.now() + 1000 * 60 * 45) },
                  { id: 'aws-role-dev', type: 'aws', expires: new Date(Date.now() + 1000 * 60 * 15) },
                ].map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20">
                    <div>
                      <p className="text-xs font-medium text-white font-mono">{lease.id}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{lease.type}</p>
                    </div>
                    <LeaseTimer expiresAt={lease.expires} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* API Request Volume Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-8 glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyber-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">API Request Volume</h3>
                  <p className="text-xs text-gray-500">Last 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyber-cyan shadow-[0_0_6px_#00f5ff]" />
                  <span className="text-xs text-gray-400">Requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-plasma-pink shadow-[0_0_6px_#ec4899]" />
                  <span className="text-xs text-gray-400">Errors</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <ChartGradientDefs />
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                  <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                  <Tooltip content={<GlassTooltip />} />
                  <Area type="monotone" dataKey="requests" stroke="#00f5ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                  <Area type="monotone" dataKey="errors" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Platform Distribution */}
          <motion.div variants={itemVariants} className="lg:col-span-4 glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyber-purple" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Platform Distribution</h3>
                <p className="text-xs text-gray-500">Secrets by provider</p>
              </div>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {platformDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          style={{ filter: `drop-shadow(0 0 6px ${entry.color}40)` }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">2,847</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {platformDistribution.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: platform.color, boxShadow: `0 0 6px ${platform.color}` }}
                    />
                    <span className="text-xs text-gray-300">{platform.name}</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-white">{platform.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Secret Types & Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Secret Types Breakdown */}
          <motion.div variants={itemVariants} className="lg:col-span-4 glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon-emerald/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-neon-emerald" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Secret Types</h3>
                <p className="text-xs text-gray-500">Breakdown by category</p>
              </div>
            </div>
            <div className="space-y-4">
              {secretTypes.map((type, i) => (
                <BarItem
                  key={type.label}
                  label={type.label}
                  value={type.value}
                  maxValue={type.maxValue}
                  color={['cyan', 'gold', 'purple', 'emerald'][i] as 'cyan' | 'gold' | 'purple' | 'emerald'}
                />
              ))}
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div variants={itemVariants} className="lg:col-span-8 glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-vault-gold/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-vault-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">System Health</h3>
                  <p className="text-xs text-gray-500">Real-time performance metrics</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <ProgressRing progress={92} color="cyan" value="92%" label="Availability" />
              </div>
              <div className="text-center">
                <ProgressRing progress={78} color="emerald" value="78%" label="CPU" />
              </div>
              <div className="text-center">
                <ProgressRing progress={45} color="gold" value="45%" label="Memory" />
              </div>
              <div className="text-center">
                <ProgressRing progress={23} color="purple" value="23%" label="Storage" />
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-black/20">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse" />
                  <span className="text-gray-400">All services healthy</span>
                </div>
                <span className="text-gray-500 font-mono">Last check: 2s ago</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Audit Log */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyber-purple" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Audit Events</h3>
                <p className="text-xs text-gray-500">Real-time activity monitoring</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              { time: '10:42:15', type: 'read', path: 'secret/data/app-config', actor: 'web-service', status: 'success' },
              { time: '10:41:03', type: 'update', path: 'sys/policy/admin', actor: 'sys-admin', status: 'success' },
              { time: '10:38:55', type: 'delete', path: 'secret/data/legacy-creds', actor: 'sys-admin', status: 'success' },
              { time: '10:35:12', type: 'read', path: 'secret/data/prod-db', actor: 'unknown', status: 'denied' },
            ].map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] text-gray-500 w-16">{log.time}</span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider border",
                    log.type === 'read' && "bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20",
                    log.type === 'update' && "bg-vault-gold/10 text-vault-gold border-vault-gold/20",
                    log.type === 'delete' && "bg-plasma-pink/10 text-plasma-pink border-plasma-pink/20"
                  )}>{log.type}</span>
                  <span className="text-sm font-mono text-gray-300">{log.path}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600">Actor:</span>
                    <span className="text-xs font-medium text-cyber-cyan">{log.actor}</span>
                  </div>
                  {log.status === 'denied' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-plasma-pink/10 border border-plasma-pink/20">
                      <AlertTriangle className="w-3 h-3 text-plasma-pink" />
                      <span className="text-[10px] text-plasma-pink font-medium">Denied</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </VaultShell>
  );
}
