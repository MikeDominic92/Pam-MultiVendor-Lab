import React from 'react';
import { Search, Bell, User, Shield } from 'lucide-react';

export function VaultHeader() {
    return (
        <header className="h-16 border-b border-white/5 bg-obsidian-black/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8 ml-64">
            <div className="flex items-center gap-4 w-96">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-gray group-focus-within:text-vault-gold transition-colors" />
                    <input
                        type="text"
                        placeholder="Search secrets, policies, or leases..."
                        className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-ghost-white focus:outline-none focus:border-vault-gold/30 focus:ring-1 focus:ring-vault-gold/30 transition-all placeholder:text-slate-gray/50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Shield className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">Root Token Active</span>
                </div>

                <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-slate-gray hover:text-ghost-white">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-ruby-danger rounded-full animate-pulse" />
                </button>

                <div className="h-8 w-px bg-white/5" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-ghost-white">Admin User</p>
                        <p className="text-xs text-slate-gray">sys-admin</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vault-gold to-amber-600 p-[1px]">
                        <div className="w-full h-full rounded-full bg-obsidian-black flex items-center justify-center">
                            <User className="w-5 h-5 text-vault-gold" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
