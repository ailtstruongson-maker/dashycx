
import React, { useEffect } from 'react';
import DashboardView from './components/views/DashboardView';

declare const lucide: any;

export default function App() {
    
    useEffect(() => {
        if (typeof lucide !== 'undefined' && lucide) {
            lucide.createIcons();
        }
    }, []);

    return (
        <div className="h-screen">
            <main className="w-full h-full overflow-y-auto">
                <DashboardView />
            </main>
        </div>
    );
}
