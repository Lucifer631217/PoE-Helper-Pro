import React, { useState, useEffect } from 'react';
import { CheatsheetViewer } from './CheatsheetViewer';

export default function ViewerApp() {
    const [data, setData] = useState({ images: [], hotkeyLabel: '' });

    useEffect(() => {
        const applyFontScale = () => {
            try {
                const saved = JSON.parse(localStorage.getItem('poe_helper_config') || '{}');
                const fontSize = Number.isFinite(saved.fontSize) ? saved.fontSize : 13;
                document.documentElement.style.setProperty('--poe-ui-scale', String(fontSize / 13));
            } catch (e) {
                document.documentElement.style.setProperty('--poe-ui-scale', '1');
            }
        };

        applyFontScale();
        window.addEventListener('storage', applyFontScale);
        return () => {
            window.removeEventListener('storage', applyFontScale);
            document.documentElement.style.removeProperty('--poe-ui-scale');
        };
    }, []);

    useEffect(() => {
        if (!window.electronAPI) return;

        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const id = params.get('id');

        window.electronAPI.getViewerData(id).then(d => {
            if (d) setData(d);
        });

        window.electronAPI.onUpdateViewerData((d) => {
            setData(d);
        });

        return () => window.electronAPI.offUpdateViewerData();
    }, []);

    const handleClose = () => {
        if (window.electronAPI) {
            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            const id = params.get('id');
            window.electronAPI.closeViewer(id);
        }
    };

    return (
        <div className="poe-viewer w-screen h-screen flex flex-col font-sans relative">
            <CheatsheetViewer images={data.images} hotkeyLabel={data.hotkeyLabel} onClose={handleClose} />
        </div>
    );
}
