'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

interface VaultDoorProps {
    status: 'locked' | 'unlocked';
}

export function VaultDoor({ status }: VaultDoorProps) {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-vault-surface shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-obsidian-black" />

            {/* Rotating Ring */}
            <motion.div
                animate={{ rotate: status === 'unlocked' ? 360 : 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-2 rounded-full border-2 border-dashed border-vault-gold/30"
            />

            {/* Inner Mechanism */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-vault-surface to-black border border-white/5 flex items-center justify-center shadow-inner">
                <motion.div
                    initial={false}
                    animate={{
                        scale: status === 'unlocked' ? 1.1 : 1,
                        borderColor: status === 'unlocked' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 215, 0, 0.3)'
                    }}
                    className="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-colors duration-500"
                >
                    {status === 'locked' ? (
                        <Lock className="w-12 h-12 text-vault-gold" />
                    ) : (
                        <Unlock className="w-12 h-12 text-emerald-success" />
                    )}
                </motion.div>
            </div>

            {/* Bolts */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <motion.div
                    key={deg}
                    className="absolute w-4 h-8 bg-vault-gold/20 rounded-sm"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-110px)`
                    }}
                    animate={{
                        y: status === 'unlocked' ? -120 : -110,
                        opacity: status === 'unlocked' ? 0.5 : 1
                    }}
                />
            ))}
        </div>
    );
}
