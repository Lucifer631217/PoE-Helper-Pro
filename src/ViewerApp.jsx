import React, { useState, useEffect } from 'react';
import { CheatsheetViewer } from './CheatsheetViewer';

export default function ViewerApp() {
    const [data, setData] = useState({ images: [], hotkeyLabel: '' });

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
        <div className="w-screen h-screen bg-[#121212] flex flex-col font-sans relative">
            <CheatsheetViewer images={data.images} hotkeyLabel={data.hotkeyLabel} onClose={handleClose} />
        </div>
    );
}
