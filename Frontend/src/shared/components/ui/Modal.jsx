import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md', accent = true }) => {
    const sizes = {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
        full: 'sm:max-w-[95vw] h-[95vh]',
    };

    useEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            {/* Backdrop click listener */}
            <div className="absolute inset-0" onClick={onClose} />
            
            <div className={cn(
                "relative bg-white rounded-xl shadow-lg w-full overflow-hidden flex flex-col",
                sizes[size]
            )}>
                {/* Header */}
                <div className={cn(
                    "px-6 py-4 flex items-center justify-between border-b",
                    accent ? "border-primary/15 bg-primary/5" : "border-gray-100 bg-gray-50/50"
                )}>
                    <h2 className={cn(
                        "text-xl font-semibold",
                        accent ? "text-slate-900" : "text-gray-900"
                    )}>
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>

                {/* Body */}
                <div 
                    className="px-6 py-4 max-h-[75vh] overflow-y-auto"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={cn(
                        "px-6 py-4 border-t flex items-center justify-end gap-3",
                        accent ? "bg-primary/5 border-primary/10" : "bg-gray-50/50 border-gray-100"
                    )}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
