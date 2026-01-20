'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration || 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-neon-emerald/10',
        borderColor: 'border-neon-emerald/20',
        iconColor: 'text-neon-emerald',
        glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-plasma-pink/10',
        borderColor: 'border-plasma-pink/20',
        iconColor: 'text-plasma-pink',
        glowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]',
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-vault-gold/10',
        borderColor: 'border-vault-gold/20',
        iconColor: 'text-vault-gold',
        glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    },
    info: {
        icon: Info,
        bgColor: 'bg-cyber-cyan/10',
        borderColor: 'border-cyber-cyan/20',
        iconColor: 'text-cyber-cyan',
        glowColor: 'shadow-[0_0_20px_rgba(0,245,255,0.2)]',
    },
};

function ToastContainer({
    toasts,
    removeToast,
}: {
    toasts: Toast[];
    removeToast: (id: string) => void;
}) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => {
                    const config = toastConfig[toast.type];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 30,
                            }}
                            className={cn(
                                "min-w-[320px] max-w-[400px] p-4 rounded-2xl border backdrop-blur-xl",
                                config.bgColor,
                                config.borderColor,
                                config.glowColor
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                    config.bgColor
                                )}>
                                    <Icon className={cn("w-5 h-5", config.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
                                    {toast.message && (
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{toast.message}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <motion.div
                                className={cn("h-0.5 mt-3 rounded-full", config.bgColor)}
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
                            >
                                <div className={cn("h-full rounded-full", config.iconColor.replace('text-', 'bg-'))} style={{ width: '100%' }} />
                            </motion.div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

// Convenience functions for common toast types
export function useToastActions() {
    const { addToast } = useToast();

    return {
        success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
        error: (title: string, message?: string) => addToast({ type: 'error', title, message }),
        warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
        info: (title: string, message?: string) => addToast({ type: 'info', title, message }),
    };
}
