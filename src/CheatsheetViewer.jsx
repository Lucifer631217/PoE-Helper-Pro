import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CheatsheetViewer = ({ images, onClose, hotkeyLabel }) => {
    const [scale, setScale] = useState(1);
    const [currentIdx, setCurrentIdx] = useState(0);

    // Get the viewer ID from hash if we are in a standalone window, otherwise it's just local modal
    const viewerId = window.location.hash ? new URLSearchParams(window.location.hash.split('?')[1]).get('id') : 'local';

    // 載入最後記憶的圖片索引
    useEffect(() => {
        const saved = localStorage.getItem(`poe_viewer_idx_${viewerId}`);
        if (saved !== null) {
            const idx = parseInt(saved, 10);
            if (!isNaN(idx)) {
                setCurrentIdx(idx);
            }
        }
    }, [viewerId]);

    const srcs = Array.isArray(images) ? images : (images ? [images] : []);
    if (srcs.length === 0) return null;
    const safeIdx = Math.min(currentIdx, srcs.length - 1);
    const currentSrc = srcs[safeIdx];

    const saveIdx = (newIdx) => {
        setCurrentIdx(newIdx);
        localStorage.setItem(`poe_viewer_idx_${viewerId}`, newIdx);
    };

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            // 切換圖片 Ctrl + 滾輪
            if (e.deltaY > 0) {
                // 向下滾動 -> 下一張
                nextImg();
            } else {
                // 向上滾動 -> 上一張
                prevImg();
            }
        } else {
            // 一般縮放
            setScale(s => Math.min(Math.max(0.1, s - e.deltaY * 0.0015), 10));
        }
    };

    const prevImg = () => { saveIdx((safeIdx - 1 + srcs.length) % srcs.length); setScale(1); };
    const nextImg = () => { saveIdx((safeIdx + 1) % srcs.length); setScale(1); };

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
                            <span className="text-gray-400 text-[10px] font-bold min-w-[32px] text-center">{safeIdx + 1}/{srcs.length}</span>
                            <button onClick={nextImg} className="p-1 bg-white/10 rounded hover:bg-white/20 text-gray-300 transition-colors"><ChevronRight size={12} /></button>
                        </div>
                    )}
                    <span className="text-gray-400 text-[10px] font-medium hidden sm:inline">縮放: {Math.round(scale * 100)}% · 拖曳平移</span>
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
                        className={`origin-center cursor-move ${scale === 1 ? 'max-w-full max-h-full object-contain' : 'max-w-none max-h-none'}`}
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
