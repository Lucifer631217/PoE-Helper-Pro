import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Map,
    X,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Plus,
    Trash2,
    MapPin,
    EyeOff,
    Eye,
    ClipboardPaste,
    ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function normalizeImages(raw) {
    const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return arr
        .map((item, idx) => {
            if (typeof item === 'string') {
                return item ? { id: `${item}_${idx}`, src: item, name: `圖片 ${idx + 1}` } : null;
            }
            if (item && typeof item === 'object' && item.src) {
                return {
                    id: item.id || `${item.src}_${idx}`,
                    src: item.src,
                    name: item.name || `圖片 ${idx + 1}`
                };
            }
            return null;
        })
        .filter(Boolean);
}

const DEFAULT_VIEW = { scale: 1, x: 0, y: 0 };
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const safeJsonParse = (raw, fallback) => {
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

export const CheatsheetViewer = ({ viewerId: propViewerId, images, onImagesChange, onClose, hotkeyLabel }) => {
    const viewerId = propViewerId || (window.location.hash ? new URLSearchParams(window.location.hash.split('?')[1]).get('id') : null) || 'local';
    const isElectron = !!(window.electronAPI && window.electronAPI.isElectron);

    const items = useMemo(() => normalizeImages(images), [images]);

    const [currentIdx, setCurrentIdx] = useState(() => {
        const saved = parseInt(localStorage.getItem(`poe_viewer_idx_${viewerId}`) || '0', 10);
        return Number.isFinite(saved) && saved >= 0 ? saved : 0;
    });
    const [mapReveal, setMapReveal] = useState(() => localStorage.getItem(`poe_viewer_map_reveal_${viewerId}`) === '1');
    const [autoHide, setAutoHide] = useState(() => localStorage.getItem(`poe_viewer_autohide_${viewerId}`) === '1');
    const [isTopHovered, setIsTopHovered] = useState(false);

    // 獨立視窗透明度 (0.3 ~ 1.0)
    const [viewerOpacity, setViewerOpacity] = useState(() => {
        const saved = parseFloat(localStorage.getItem(`poe_viewer_opacity_${viewerId}`) || '1');
        return Number.isFinite(saved) ? clamp(saved, 0.3, 1) : 1;
    });

    // 每張圖獨立的縮放與位移: { [src]: { scale, x, y } }
    const [viewsBySrc, setViewsBySrc] = useState(() => safeJsonParse(localStorage.getItem(`poe_viewer_views_${viewerId}`), {}));
    // 每張圖獨立的進度釘選點: { [src]: { xPct, yPct } }
    const [pinsBySrc, setPinsBySrc] = useState(() => safeJsonParse(localStorage.getItem(`poe_viewer_pins_${viewerId}`), {}));

    const [pinMode, setPinMode] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [renamingIdx, setRenamingIdx] = useState(null);
    const [renameDraft, setRenameDraft] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    const stageRef = useRef(null);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: 0 });
    const toastTimerRef = useRef(null);

    const safeIdx = items.length > 0 ? Math.min(currentIdx, items.length - 1) : 0;
    const currentItem = items[safeIdx] || null;
    const currentSrc = currentItem?.src || '';
    const view = (currentSrc && viewsBySrc[currentSrc]) || DEFAULT_VIEW;
    const currentPin = (currentSrc && pinsBySrc[currentSrc]) || null;

    const showStatus = useCallback((msg) => {
        setStatusMsg(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setStatusMsg(''), 2000);
    }, []);

    // Electron 初始載入獨立透明度
    useEffect(() => {
        if (!isElectron || !window.electronAPI.getViewerOpacity) return;
        window.electronAPI.getViewerOpacity(viewerId).then((op) => {
            if (typeof op === 'number') setViewerOpacity(clamp(op, 0.3, 1));
        });
    }, [isElectron, viewerId]);

    // 儲存每張圖的視角與釘選點
    useEffect(() => {
        localStorage.setItem(`poe_viewer_views_${viewerId}`, JSON.stringify(viewsBySrc));
    }, [viewerId, viewsBySrc]);

    useEffect(() => {
        localStorage.setItem(`poe_viewer_pins_${viewerId}`, JSON.stringify(pinsBySrc));
    }, [viewerId, pinsBySrc]);

    const saveIdx = useCallback((newIdx) => {
        setCurrentIdx(newIdx);
        localStorage.setItem(`poe_viewer_idx_${viewerId}`, String(newIdx));
    }, [viewerId]);

    const updateCurrentView = useCallback((updater) => {
        if (!currentSrc) return;
        setViewsBySrc((prev) => {
            const cur = prev[currentSrc] || DEFAULT_VIEW;
            const next = typeof updater === 'function' ? updater(cur) : updater;
            return { ...prev, [currentSrc]: next };
        });
    }, [currentSrc]);

    const resetView = useCallback(() => {
        updateCurrentView(DEFAULT_VIEW);
    }, [updateCurrentView]);

    const prevImg = useCallback(() => {
        if (items.length <= 1) return;
        saveIdx((safeIdx - 1 + items.length) % items.length);
    }, [safeIdx, items.length, saveIdx]);

    const nextImg = useCallback(() => {
        if (items.length <= 1) return;
        saveIdx((safeIdx + 1) % items.length);
    }, [safeIdx, items.length, saveIdx]);

    // 以指定視窗座標 (clientX, clientY) 為中心縮放
    const zoomAtPoint = useCallback((factor, clientX, clientY) => {
        if (!stageRef.current || !currentSrc) return;
        const rect = stageRef.current.getBoundingClientRect();
        const cx = clientX ?? rect.left + rect.width / 2;
        const cy = clientY ?? rect.top + rect.height / 2;
        const mx = cx - (rect.left + rect.width / 2);
        const my = cy - (rect.top + rect.height / 2);

        updateCurrentView((cur) => {
            const nextScale = clamp(Number((cur.scale * factor).toFixed(3)), 0.2, 8);
            const ratio = nextScale / cur.scale;
            return {
                scale: nextScale,
                x: mx - (mx - cur.x) * ratio,
                y: my - (my - cur.y) * ratio
            };
        });
    }, [currentSrc, updateCurrentView]);

    const zoomIn = useCallback(() => zoomAtPoint(1.25), [zoomAtPoint]);
    const zoomOut = useCallback(() => zoomAtPoint(1 / 1.25), [zoomAtPoint]);

    const toggleMapReveal = useCallback(() => {
        setMapReveal((enabled) => {
            const next = !enabled;
            localStorage.setItem(`poe_viewer_map_reveal_${viewerId}`, next ? '1' : '0');
            return next;
        });
    }, [viewerId]);

    const toggleAutoHide = useCallback(() => {
        setAutoHide((enabled) => {
            const next = !enabled;
            localStorage.setItem(`poe_viewer_autohide_${viewerId}`, next ? '1' : '0');
            return next;
        });
    }, [viewerId]);

    const handleOpacityChange = (val) => {
        const next = clamp(val, 0.3, 1);
        setViewerOpacity(next);
        localStorage.setItem(`poe_viewer_opacity_${viewerId}`, String(next));
        if (isElectron && window.electronAPI.setViewerOpacity) {
            window.electronAPI.setViewerOpacity(viewerId, next);
        }
    };

    // 新增圖片（支援 File 陣列或已存路徑字串）
    const appendImageFiles = useCallback(async (files, fallbackPrefix = '截圖') => {
        if (!onImagesChange || !files || files.length === 0) return;
        const newItems = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type?.startsWith('image/')) continue;
            const dataUrl = await readFileAsDataUrl(file);
            let finalSrc = dataUrl;
            if (isElectron && window.electronAPI.saveImageDataUrl) {
                const saved = await window.electronAPI.saveImageDataUrl(dataUrl);
                if (saved) finalSrc = saved;
            }
            const baseName = file.name ? file.name.replace(/\.[^.]+$/, '') : `${fallbackPrefix} ${items.length + newItems.length + 1}`;
            newItems.push({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                src: finalSrc,
                name: baseName || `${fallbackPrefix} ${items.length + newItems.length + 1}`
            });
        }
        if (newItems.length > 0) {
            const nextList = [...items, ...newItems];
            onImagesChange(nextList);
            saveIdx(nextList.length - 1);
            showStatus(`已新增 ${newItems.length} 張圖片`);
        }
    }, [onImagesChange, isElectron, items, saveIdx, showStatus]);

    const handleAddClick = async () => {
        if (!onImagesChange) return;
        if (isElectron) {
            const paths = await window.electronAPI.selectImages();
            if (paths && paths.length > 0) {
                const newItems = paths.map((p, i) => ({
                    id: `${Date.now()}_${i}`,
                    src: p,
                    name: `天賦圖 ${items.length + i + 1}`
                }));
                const nextList = [...items, ...newItems];
                onImagesChange(nextList);
                saveIdx(nextList.length - 1);
                showStatus(`已新增 ${newItems.length} 張圖片`);
            }
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleDeleteTab = (idx, e) => {
        e?.stopPropagation();
        if (!onImagesChange) return;
        const removed = items[idx];
        const nextList = items.filter((_, i) => i !== idx);
        onImagesChange(nextList);
        if (removed?.src) {
            setViewsBySrc((prev) => { const n = { ...prev }; delete n[removed.src]; return n; });
            setPinsBySrc((prev) => { const n = { ...prev }; delete n[removed.src]; return n; });
        }
        if (safeIdx >= nextList.length) saveIdx(Math.max(0, nextList.length - 1));
        showStatus('已刪除圖片');
    };

    const handleMoveTab = (idx, delta, e) => {
        e?.stopPropagation();
        if (!onImagesChange) return;
        const target = idx + delta;
        if (target < 0 || target >= items.length) return;
        const nextList = [...items];
        const [moved] = nextList.splice(idx, 1);
        nextList.splice(target, 0, moved);
        onImagesChange(nextList);
        if (safeIdx === idx) saveIdx(target);
        else if (safeIdx === target) saveIdx(idx);
    };

    const commitRename = () => {
        if (renamingIdx === null || !onImagesChange) {
            setRenamingIdx(null);
            return;
        }
        const trimmed = renameDraft.trim();
        if (trimmed) {
            const nextList = items.map((item, i) => (i === renamingIdx ? { ...item, name: trimmed } : item));
            onImagesChange(nextList);
        }
        setRenamingIdx(null);
    };

    // Ctrl+V 貼上剪貼簿圖片
    useEffect(() => {
        const onPaste = async (e) => {
            if (!onImagesChange) return;
            const clipItems = Array.from(e.clipboardData?.items || []);
            const imgFiles = clipItems
                .filter((it) => it.type.startsWith('image/'))
                .map((it) => it.getAsFile())
                .filter(Boolean);
            if (imgFiles.length > 0) {
                e.preventDefault();
                await appendImageFiles(imgFiles, '貼上截圖');
            }
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [onImagesChange, appendImageFiles]);

    // 鍵盤快捷操作
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                if (e.key === 'Escape') setRenamingIdx(null);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                if (pinMode) setPinMode(false);
                else onClose?.();
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
            } else if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                setPinMode((v) => !v);
            } else if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                toggleAutoHide();
            } else if (/^[1-9]$/.test(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (idx < items.length) {
                    e.preventDefault();
                    saveIdx(idx);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [pinMode, onClose, prevImg, nextImg, zoomIn, zoomOut, resetView, toggleMapReveal, toggleAutoHide, items.length, saveIdx]);

    // 滾輪縮放（游標中心）或 Ctrl+滾輪換圖
    const handleWheel = (e) => {
        if (items.length === 0) return;
        e.preventDefault();
        if (e.ctrlKey) {
            if (e.deltaY > 0) nextImg();
            else prevImg();
        } else {
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            zoomAtPoint(factor, e.clientX, e.clientY);
        }
    };

    // 指標拖曳與釘選放置
    const placePinAtEvent = (e) => {
        if (!imgRef.current || !currentSrc) return;
        const rect = imgRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const xPct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        const yPct = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        setPinsBySrc((prev) => ({ ...prev, [currentSrc]: { xPct, yPct } }));
        setPinMode(false);
        showStatus('已標記天賦進度點（右鍵可移除）');
    };

    const handlePointerDown = (e) => {
        if (e.button !== 0 || items.length === 0) return;
        if (e.shiftKey || pinMode) {
            e.preventDefault();
            placePinAtEvent(e);
            return;
        }
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragRef.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            originX: view.x,
            originY: view.y,
            moved: 0
        };
    };

    const handlePointerMove = (e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        dragRef.current.moved = Math.hypot(dx, dy);
        updateCurrentView((cur) => ({
            ...cur,
            x: dragRef.current.originX + dx,
            y: dragRef.current.originY + dy
        }));
    };

    const handlePointerUp = () => {
        dragRef.current.active = false;
    };

    const handleDoubleClick = (e) => {
        if (items.length === 0 || pinMode || e.shiftKey) return;
        if (Math.abs(view.scale - 1) < 0.08) {
            zoomAtPoint(2.5 / view.scale, e.clientX, e.clientY);
        } else {
            resetView();
        }
    };

    const clearCurrentPin = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!currentSrc) return;
        setPinsBySrc((prev) => {
            const next = { ...prev };
            delete next[currentSrc];
            return next;
        });
        showStatus('已清除進度釘選');
    };

    const handleDragOver = (e) => {
        if (!onImagesChange) return;
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDraggingOver(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) await appendImageFiles(files, '天賦圖');
    };

    const hideChrome = autoHide && !isTopHovered && renamingIdx === null && items.length > 0;

    return (
        <motion.div
            initial={{ opacity: isElectron ? 1 : viewerOpacity }}
            animate={{ opacity: isElectron ? 1 : viewerOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="poe-viewer fixed inset-0 z-[100] flex flex-col overflow-hidden select-none"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* 自動隱藏時的頂部感應條 */}
            {autoHide && (
                <div
                    className="fixed top-0 left-0 right-0 h-3.5 z-40"
                    onMouseEnter={() => setIsTopHovered(true)}
                />
            )}

            {/* 頂部工具列 + 分頁列 */}
            <div
                onMouseEnter={() => setIsTopHovered(true)}
                onMouseLeave={() => setIsTopHovered(false)}
                className={`z-30 shrink-0 transition-all duration-200 ${hideChrome ? '-translate-y-full opacity-0 pointer-events-none absolute top-0 left-0 right-0' : 'translate-y-0 opacity-100 relative'}`}
            >
                {/* 主工具列 */}
                <div className="poe-viewer-toolbar h-9 flex items-center justify-between px-2.5 gap-2 border-b" style={{ WebkitAppRegion: 'drag' }}>
                    <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
                        <div className="poe-viewer-chip flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                            <kbd>{hotkeyLabel || 'F9'}</kbd>
                        </div>

                        {items.length > 0 && (
                            <>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={zoomOut} className="poe-viewer-btn p-1" title="縮小 (-)">
                                        <ZoomOut size={12} />
                                    </button>
                                    <button onClick={resetView} className="poe-viewer-btn text-[10px] font-mono px-1.5 py-0.5 min-w-[40px] text-center tabular-nums" title="重置視角 (0)">
                                        {Math.round(view.scale * 100)}%
                                    </button>
                                    <button onClick={zoomIn} className="poe-viewer-btn p-1" title="放大 (+)">
                                        <ZoomIn size={12} />
                                    </button>
                                    {(Math.abs(view.scale - 1) > 0.02 || view.x !== 0 || view.y !== 0) && (
                                        <button onClick={resetView} className="poe-viewer-btn p-1" title="歸零位置 (0)">
                                            <RotateCcw size={11} />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setPinMode((v) => !v)}
                                    className={`poe-viewer-btn flex items-center gap-1 text-[10px] px-1.5 py-0.5 shrink-0 ${pinMode ? 'poe-viewer-btn-active' : ''}`}
                                    title="點擊天賦樹標記目前點到的位置（亦可 Shift+左鍵直接標記，快捷鍵 P）"
                                    aria-pressed={pinMode}
                                >
                                    <MapPin size={11} />
                                    <span>{pinMode ? '請點圖標記' : '進度釘選'}</span>
                                </button>

                                {currentPin && (
                                    <button
                                        onClick={clearCurrentPin}
                                        className="poe-viewer-btn text-[10px] px-1.5 py-0.5 shrink-0"
                                        title="清除本張圖的進度釘選"
                                    >
                                        清釘選
                                    </button>
                                )}

                                <button
                                    onClick={toggleMapReveal}
                                    className={`poe-viewer-btn flex items-center gap-1 text-[10px] px-1.5 py-0.5 shrink-0 ${mapReveal ? 'poe-viewer-btn-active' : ''}`}
                                    title="強化暗部與路線對比 (M)"
                                    aria-pressed={mapReveal}
                                >
                                    <Map size={11} />
                                    <span>地圖全開</span>
                                </button>

                                <button
                                    onClick={toggleAutoHide}
                                    className={`poe-viewer-btn flex items-center gap-1 text-[10px] px-1.5 py-0.5 shrink-0 ${autoHide ? 'poe-viewer-btn-active' : ''}`}
                                    title="滑鼠移開時自動隱藏工具列（純淨視圖，快捷鍵 H）"
                                    aria-pressed={autoHide}
                                >
                                    {autoHide ? <EyeOff size={11} /> : <Eye size={11} />}
                                    <span>純淨</span>
                                </button>
                            </>
                        )}

                        {/* 獨立透明度 */}
                        <div className="flex items-center gap-1.5 pl-1 shrink-0" title={`視窗透明度 ${Math.round(viewerOpacity * 100)}%`}>
                            <span className="poe-viewer-hint text-[9px] font-mono tabular-nums">{Math.round(viewerOpacity * 100)}%</span>
                            <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.05"
                                value={viewerOpacity}
                                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                                className="poe-viewer-opacity w-14 cursor-pointer appearance-none"
                            />
                        </div>
                    </div>

                    <button onClick={onClose} style={{ WebkitAppRegion: 'no-drag' }} className="poe-viewer-close p-1.5 rounded-[4px] transition-colors shrink-0" title="關閉 (Esc)">
                        <X size={14} />
                    </button>
                </div>

                {/* 分頁標籤列 */}
                {(items.length > 0 || onImagesChange) && (
                    <div className="poe-viewer-tabs flex items-center gap-1 px-2 py-1 border-b overflow-x-auto no-scrollbar">
                        {items.map((item, idx) => {
                            const isActive = idx === safeIdx;
                            const isRenaming = idx === renamingIdx;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => { if (!isRenaming) saveIdx(idx); }}
                                    onDoubleClick={() => { setRenamingIdx(idx); setRenameDraft(item.name); }}
                                    className={`poe-viewer-tab flex items-center gap-1 px-2 py-0.5 text-[10px] cursor-pointer shrink-0 transition-colors ${isActive ? 'poe-viewer-tab-active font-bold' : ''}`}
                                    title="點擊切換 · 雙擊可重新命名"
                                >
                                    <span className="opacity-55 font-mono">{idx + 1}.</span>
                                    {isRenaming ? (
                                        <input
                                            autoFocus
                                            value={renameDraft}
                                            onChange={(e) => setRenameDraft(e.target.value)}
                                            onBlur={commitRename}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') commitRename();
                                                else if (e.key === 'Escape') setRenamingIdx(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="poe-viewer-tab-input text-[10px] px-1 w-24"
                                        />
                                    ) : (
                                        <span className="max-w-[110px] truncate">{item.name}</span>
                                    )}
                                    {isActive && items.length > 1 && !isRenaming && (
                                        <span className="flex items-center gap-0.5 ml-0.5">
                                            <button
                                                onClick={(e) => handleMoveTab(idx, -1, e)}
                                                disabled={idx === 0}
                                                className="opacity-60 hover:opacity-100 disabled:opacity-20"
                                                title="左移"
                                            >
                                                <ChevronLeft size={10} />
                                            </button>
                                            <button
                                                onClick={(e) => handleMoveTab(idx, 1, e)}
                                                disabled={idx === items.length - 1}
                                                className="opacity-60 hover:opacity-100 disabled:opacity-20"
                                                title="右移"
                                            >
                                                <ChevronRight size={10} />
                                            </button>
                                        </span>
                                    )}
                                    {onImagesChange && !isRenaming && (
                                        <button
                                            onClick={(e) => handleDeleteTab(idx, e)}
                                            className="opacity-50 hover:opacity-100 hover:text-red-400 ml-0.5"
                                            title="刪除此張圖片"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {onImagesChange && (
                            <button
                                onClick={handleAddClick}
                                className="poe-viewer-btn flex items-center gap-1 px-2 py-0.5 text-[10px] shrink-0"
                                title="新增圖片檔案（或直接 Ctrl+V 貼上截圖）"
                            >
                                <Plus size={11} />
                                <span>新增</span>
                            </button>
                        )}
                        <span className="poe-viewer-hint text-[9px] ml-auto pl-2 hidden sm:inline shrink-0">
                            Ctrl+V 貼上截圖 · Shift+點擊標記 · 雙擊放大
                        </span>
                    </div>
                )}
            </div>

            {/* 圖片主舞台 */}
            <div
                ref={stageRef}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={handleDoubleClick}
                className={`poe-viewer-stage flex-1 relative overflow-hidden flex items-center justify-center ${pinMode ? 'cursor-crosshair' : items.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{ WebkitAppRegion: 'no-drag' }}
            >
                {items.length === 0 ? (
                    <div className="poe-viewer-dropzone p-6 max-w-sm mx-4 text-center space-y-3">
                        <div className="flex justify-center">
                            <ClipboardPaste size={28} className="opacity-85" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold">尚未載入天賦圖</p>
                            <p className="poe-viewer-hint text-xs leading-relaxed">
                                從 PoB 或網頁截圖後，直接在此視窗按 <kbd className="poe-modal-kbd px-1.5 py-0.5">Ctrl+V</kbd> 貼上，或拖曳圖片檔案進來。
                            </p>
                        </div>
                        {onImagesChange && (
                            <button
                                onClick={handleAddClick}
                                className="poe-primary-btn inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-[4px]"
                            >
                                <ImagePlus size={14} />
                                <span>選擇圖片檔案</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        style={{
                            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
                            transformOrigin: 'center center'
                        }}
                        className="relative inline-flex items-center justify-center will-change-transform"
                    >
                        <img
                            ref={imgRef}
                            src={currentSrc}
                            alt={currentItem?.name || 'PoE Helper'}
                            draggable={false}
                            className={`max-w-[96vw] max-h-[86vh] object-contain pointer-events-none select-none ${mapReveal ? 'poe-map-reveal' : ''}`}
                        />
                        {currentPin && (
                            <div
                                onContextMenu={clearCurrentPin}
                                style={{
                                    left: `${currentPin.xPct * 100}%`,
                                    top: `${currentPin.yPct * 100}%`,
                                    transform: `translate(-50%, -50%) scale(${1 / view.scale})`
                                }}
                                className="poe-viewer-pin cursor-pointer"
                                title="目前天賦進度點（右鍵移除）"
                            >
                                <div className="poe-viewer-pin-diamond" />
                            </div>
                        )}
                    </div>
                )}

                {/* 拖曳覆蓋提示 */}
                {isDraggingOver && (
                    <div className="poe-viewer-dropzone fixed inset-3 z-50 flex flex-col items-center justify-center pointer-events-none">
                        <ImagePlus size={32} />
                        <p className="mt-2 text-sm font-bold">放開滑鼠以匯入圖片</p>
                    </div>
                )}

                {/* 浮動狀態提示 */}
                <AnimatePresence>
                    {statusMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="poe-viewer-toast fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-medium z-40 pointer-events-none"
                        >
                            ◆ {statusMsg}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    appendImageFiles(Array.from(e.target.files || []), '天賦圖');
                    e.target.value = '';
                }}
            />
        </motion.div>
    );
};
