'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
    const [storageData, setStorageData] = useState<any>({});

    useEffect(() => {
        const data = {
            accessToken: localStorage.getItem('accessToken')?.substring(0, 50) + '...',
            refreshToken: localStorage.getItem('refreshToken')?.substring(0, 50) + '...',
            user: localStorage.getItem('user'),
            userName: localStorage.getItem('userName'),
        };
        setStorageData(data);
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug - Local Storage Data</h1>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(storageData, null, 2)}
            </pre>
        </div>
    );
}