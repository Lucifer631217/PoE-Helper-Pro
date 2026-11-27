import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Map, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CheatsheetViewer = ({ images, onClose, hotkeyLabel }) => {
    const [scale, setScale] = useState(1);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [mapReveal, setMapReveal] = useState(false);
    const [resetNonce, setResetNonce] = useState(0);

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

    useEffect(() => {
        setMapReveal(localStorage.getItem(`poe_viewer_map_reveal_${viewerId}`) === '1');
    }, [viewerId]);

    const srcs = Array.isArray(images) ? images : (images ? [images] : []);
    const safeIdx = srcs.length > 0 ? Math.min(currentIdx, srcs.length - 1) : 0;
    const currentSrc = srcs[safeIdx];

    const saveIdx = useCallback((newIdx) => {
        setCurrentIdx(newIdx);
        localStorage.setItem(`poe_viewer_idx_${viewerId}`, newIdx);
    }, [viewerId]);

    const resetView = useCallback(() => {
        setScale(1);
        setResetNonce(n => n + 1);
    }, []);

    const prevImg = useCallback(() => {
        if (srcs.length <= 1) return;
        saveIdx((safeIdx - 1 + srcs.length) % srcs.length);
        setScale(1);
        setResetNonce(n => n + 1);
    }, [safeIdx, srcs.length, saveIdx]);

    const nextImg = useCallback(() => {
        if (srcs.length <= 1) return;
        saveIdx((safeIdx + 1) % srcs.length);
        setScale(1);
        setResetNonce(n => n + 1);
    }, [safeIdx, srcs.length, saveIdx]);

    const zoomIn = useCallback(() => setScale(s => Math.min(10, Number((s * 1.25).toFixed(2)))), []);
    const zoomOut = useCallback(() => setScale(s => Math.max(0.2, Number((s / 1.25).toFixed(2)))), []);

    const toggleMapReveal = useCallback(() => {
        setMapReveal(enabled => {
            const next = !enabled;
            localStorage.setItem(`poe_viewer_map_reveal_${viewerId}`, next ? '1' : '0');
            return next;
        });
    }, [viewerId]);

    // 鍵盤快捷操作
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose?.();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevImg();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImg();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                zoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                resetView();
            } else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                toggleMapReveal();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose, prevImg, nextImg, zoomIn, zoomOut, resetView, toggleMapReveal]);

    if (srcs.length === 0) return null;

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            if (e.deltaY > 0) nextImg();
            else prevImg();
        } else {
            setScale(s => Math.min(Math.max(0.15, s - e.deltaY * 0.0015), 10));
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="poe-viewer fixed inset-0 z-[100] flex flex-col overflow-hidden"
            onWheel={handleWheel}
        >
            <div className="poe-viewer-toolbar h-9 flex items-center justify-between px-3 shrink-0 select-none border-b" style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-2 min-w-0" style={{ WebkitAppRegion: 'no-drag' }}>
                    <div className="poe-viewer-chip flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                        <kbd>{hotkeyLabel || 'F9'}</kbd>
                        <span className="opacity-80">隱藏</span>
                    </div>

                    {srcs.length > 1 && (
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={prevImg} className="poe-viewer-btn p-1 rounded transition-colors" title="上一張 (←)">
                                <ChevronLeft size={12} />
                            </button>
                            <span className="text-amber-100/80 text-[10px] font-mono font-bold min-w-[34px] text-center tabular-nums">
                                {safeIdx + 1}/{srcs.length}
                            </span>
                            <button onClick={nextImg} className="poe-viewer-btn p-1 rounded transition-colors" title="下一張 (→)">
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={zoomOut} className="poe-viewer-btn p-1 rounded transition-colors" title="縮小 (-)">
                            <ZoomOut size={12} />
                        </button>
                        <button onClick={resetView} className="poe-viewer-btn text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors min-w-[42px] text-center tabular-nums" title="重置縮放與位置 (0)">
                            {Math.round(scale * 100)}%
                        </button>
                        <button onClick={zoomIn} className="poe-viewer-btn p-1 rounded transition-colors" title="放大 (+)">
                            <ZoomIn size={12} />
                        </button>
                        {scale !== 1 && (
                            <button onClick={resetView} className="poe-viewer-btn p-1 rounded transition-colors" title="還原視角 (0)">
                                <RotateCcw size={11} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={toggleMapReveal}
                        className={`poe-viewer-btn flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors shrink-0 ${mapReveal ? 'poe-viewer-btn-active' : ''}`}
                        title="強化暗部、地形邊界與水域，方便查看截圖中的完整地圖 (M)"
                        aria-pressed={mapReveal}
                    >
                        <Map size={12} />
                        <span>地圖全開</span>
                    </button>

                    <span className="text-amber-100/45 text-[10px] font-medium hidden md:inline truncate">
                        滾輪縮放 · 拖曳平移{srcs.length > 1 ? ' · Ctrl+滾輪換圖' : ''}
                    </span>
                </div>

                <button onClick={onClose} style={{ WebkitAppRegion: 'no-drag' }} className="poe-viewer-close p-1.5 rounded-md transition-colors shrink-0" title="關閉 (Esc)">
                    <X size={14} />
                </button>
            </div>

            <div className="poe-viewer-stage flex-1 relative overflow-hidden flex items-center justify-center" style={{ WebkitAppRegion: 'no-drag' }}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={`${currentSrc}_${resetNonce}`}
                        src={currentSrc}
                        drag
                        dragMomentum={false}
                        style={{ scale }}
                        className={`origin-center cursor-grab active:cursor-grabbing ${mapReveal ? 'poe-map-reveal' : ''} ${scale === 1 ? 'max-w-full max-h-full object-contain' : 'max-w-none max-h-none'}`}
                        draggable={false}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.14 }}
                    />
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
