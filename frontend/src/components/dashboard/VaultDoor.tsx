'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Shield } from 'lucide-react';

interface VaultDoorProps {
    status: 'locked' | 'unlocked';
}

export function VaultDoor({ status }: VaultDoorProps) {
    const isUnlocked = status === 'unlocked';

    return (
        <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Outer glow effect */}
            <motion.div
                animate={{
                    boxShadow: isUnlocked
                        ? [
                            '0 0 40px rgba(0, 245, 255, 0.2)',
                            '0 0 60px rgba(0, 245, 255, 0.3)',
                            '0 0 40px rgba(0, 245, 255, 0.2)'
                        ]
                        : '0 0 20px rgba(251, 191, 36, 0.1)'
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
            />

            {/* Outermost ring with gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-charcoal via-onyx to-void border border-white/[0.08]" />

            {/* Animated pulse ring */}
            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute inset-1 rounded-full border ${isUnlocked ? 'border-cyber-cyan/30' : 'border-vault-gold/20'}`}
            />

            {/* Rotating dashed ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-3 rounded-full border border-dashed border-white/10"
            />

            {/* Second rotating ring (opposite direction) */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-6 rounded-full border border-dotted border-white/5"
            />

            {/* Inner glassy circle */}
            <div className="absolute inset-10 rounded-full bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-sm border border-white/[0.06]">
                {/* Inner gradient overlay */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isUnlocked ? 'bg-cyber-cyan/5' : 'bg-vault-gold/5'}`} />
            </div>

            {/* Center icon container */}
            <motion.div
                animate={{
                    scale: isUnlocked ? [1, 1.05, 1] : 1,
                    boxShadow: isUnlocked
                        ? '0 0 30px rgba(0, 245, 255, 0.4)'
                        : '0 0 15px rgba(251, 191, 36, 0.2)'
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isUnlocked
                        ? 'border-cyber-cyan/50 bg-cyber-cyan/10'
                        : 'border-vault-gold/30 bg-vault-gold/5'
                }`}
            >
                {/* Hexagon pattern overlay */}
                <div className="absolute inset-0 rounded-full opacity-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <pattern id="hexagons" width="10" height="8.66" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                            <polygon
                                points="5,0 10,2.89 10,8.66 5,8.66 0,5.77 0,2.89"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className={isUnlocked ? 'text-cyber-cyan' : 'text-vault-gold'}
                            />
                        </pattern>
                        <rect width="100" height="100" fill="url(#hexagons)" />
                    </svg>
                </div>

                {/* Icon */}
                <motion.div
                    initial={false}
                    animate={{
                        rotate: isUnlocked ? [0, 10, -10, 0] : 0,
                    }}
                    transition={{ duration: 0.5 }}
                >
                    {isUnlocked ? (
                        <Shield className="w-8 h-8 text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]" />
                    ) : (
                        <Lock className="w-8 h-8 text-vault-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    )}
                </motion.div>
            </motion.div>

            {/* Orbital dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <motion.div
                    key={deg}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut',
                    }}
                    className={`absolute w-1.5 h-1.5 rounded-full ${isUnlocked ? 'bg-cyber-cyan' : 'bg-vault-gold'}`}
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-96px)`,
                    }}
                />
            ))}

            {/* Corner accent lines */}
            {[45, 135, 225, 315].map((deg) => (
                <motion.div
                    key={`line-${deg}`}
                    className={`absolute w-6 h-[1px] ${isUnlocked ? 'bg-cyber-cyan/40' : 'bg-vault-gold/30'}`}
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-80px)`,
                    }}
                />
            ))}
        </div>
    );
}
