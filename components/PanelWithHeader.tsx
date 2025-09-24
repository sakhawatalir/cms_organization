'use client'

import Image from 'next/image';
import { ReactNode } from 'react';

interface PanelWithHeaderProps {
    title: string;
    children: ReactNode;
    onRefresh?: () => void;
    onClose?: () => void;
    className?: string;
}

export default function PanelWithHeader({
    title,
    children,
    onRefresh,
    onClose,
    className = ''
}: PanelWithHeaderProps) {
    return (
        <div className={`bg-white p-4 rounded shadow relative ${className}`}>
            <div className="flex justify-between border-b border-gray-300 pb-2 mb-2">
                <h2 className="font-semibold">{title}</h2>
                <div className="flex space-x-1">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="Refresh"
                        >
                            <Image src="/refresh-small.svg" alt="Refresh" width={16} height={16} />
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Close"
                        >
                            <Image src="/x-small.svg" alt="Close" width={16} height={16} />
                        </button>
                    )}
                </div>
            </div>

            <div>
                {children}
            </div>
        </div>
    );
}