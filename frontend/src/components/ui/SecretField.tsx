'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SecretFieldProps {
    value: string;
    label?: string;
    className?: string;
}

export function SecretField({ value, label, className }: SecretFieldProps) {
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="text-xs font-medium text-slate-gray uppercase tracking-wider">{label}</label>}
            <div className="relative group">
                <div className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-ghost-white flex items-center justify-between group-hover:border-vault-gold/30 transition-colors">
                    <span className={cn("truncate mr-4", revealed ? "text-emerald-400" : "text-slate-500 tracking-widest")}>
                        {revealed ? value : '••••••••••••••••••••••••'}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setRevealed(!revealed)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-slate-gray hover:text-white transition-colors"
                            title={revealed ? "Hide" : "Reveal"}
                        >
                            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-white/10 text-slate-gray hover:text-white transition-colors"
                            title="Copy to clipboard"
                        >
                            <AnimatePresence mode='wait'>
                                {copied ? (
                                    <motion.div
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="copy"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>

                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-vault-gold/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
        </div>
    );
}
