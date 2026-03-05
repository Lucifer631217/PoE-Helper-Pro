import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CheatsheetViewer = ({ images, onClose, hotkeyLabel }) => {
    const [scale, setScale] = useState(1);
    const [currentIdx, setCurrentIdx] = useState(0);

    const handleWheel = (e) => {
        setScale(s => Math.min(Math.max(0.1, s - e.deltaY * 0.0015), 10));
    };

    const srcs = Array.isArray(images) ? images : (images ? [images] : []);
    if (srcs.length === 0) return null;
    const currentSrc = srcs[Math.min(currentIdx, srcs.length - 1)];

    const prevImg = () => { setCurrentIdx(i => (i - 1 + srcs.length) % srcs.length); setScale(1); };
    const nextImg = () => { setCurrentIdx(i => (i + 1) % srcs.length); setScale(1); };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#121212] flex flex-col overflow-hidden"
            onWheel={handleWheel}
        >
            <div className="h-8 bg-black/40 flex items-center justify-between px-3 shrink-0 select-none border-b border-white/10" style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold border border-blue-500/30">
                        <kbd>{hotkeyLabel || 'F9'}</kbd> 隱藏
                    </div>
                    {srcs.length > 1 && (
                        <div className="flex items-center gap-1">
                            <button onClick={prevImg} className="p-1 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors"><ChevronLeft size={12} /></button>
                            <span className="text-gray-400 text-[10px] font-bold min-w-[32px] text-center">{currentIdx + 1}/{srcs.length}</span>
                            <button onClick={nextImg} className="p-1 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors"><ChevronRight size={12} /></button>
                        </div>
                    )}
                    <span className="text-gray-400 text-[10px] font-medium hidden sm:inline">縮放: {Math.round(scale * 100)}% (滾輪) · 拖曳平移</span>
                    <button onClick={() => setScale(1)} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors">100%</button>
                    <button onClick={() => setScale(s => s * 0.5)} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors">50%</button>
                </div>
                <button onClick={onClose} style={{ WebkitAppRegion: 'no-drag' }} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-red-500/80 transition-colors">
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0iIzMzMyI+PC9jaXJjbGU+Cjwvc3ZnPg==')]" style={{ WebkitAppRegion: 'no-drag' }}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentSrc}
                        src={currentSrc}
                        drag
                        dragMomentum={false}
                        style={{ scale }}
                        className="max-w-none max-h-none origin-center cursor-move"
                        draggable={false}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    />
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
