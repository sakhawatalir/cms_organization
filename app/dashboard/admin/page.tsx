// app/dashboard/admin/page.tsx

'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiGrid,
    FiUpload,
    FiDownload,
    FiArrowRight,
    FiCode,
    FiFileText,
    FiUsers,
    FiChevronDown
} from 'react-icons/fi';
import { FaRegFolderOpen } from "react-icons/fa";
import { MdDriveFolderUpload } from "react-icons/md";
import { RiFolderDownloadLine } from "react-icons/ri";
import { IoDocumentOutline } from "react-icons/io5";
import { TfiUser } from "react-icons/tfi";
import { FaRegArrowAltCircleRight } from "react-icons/fa";


interface AdminModule {
    id: string;
    name: string;
    icon: React.ReactNode;
    path: string;
}

export default function AdminCenter() {
    const router = useRouter();

    const adminModules: AdminModule[] = [
        {
            id: 'field-management',
            name: 'Field Management',
            icon: <FaRegFolderOpen size={50} color="white" />,
            path: '/dashboard/admin/field-management'
        },
        {
            id: 'data-uploader',
            name: 'Data Uploader',
            icon: <MdDriveFolderUpload size={50} color="white" />,
            path: '/dashboard/admin/data-uploader'
        },
        {
            id: 'downloader',
            name: 'Downloader',
            icon: <RiFolderDownloadLine size={50} color="white" />,
            path: '/dashboard/admin/downloader'
        },
        {
            id: 'data-scraper',
            name: 'Data Scraper',
            icon: <FiArrowRight size={50} color="white" />,
            path: '/dashboard/admin/data-scraper'
        },
        {
            id: 'api-management',
            name: 'API management',
            icon: <FiCode size={50} color="white" />,
            path: '/dashboard/admin/api-management'
        },
        {
            id: 'document-management',
            name: 'Document Management',
            icon: <IoDocumentOutline size={50} color="white" />,
            path: '/dashboard/admin/document-management'
        },
        {
            id: 'user-management',
            name: 'User Management',
            icon: <TfiUser size={50} color="white" />,
            path: '/dashboard/admin/user-management'
        },
        {
            id: 'the-button',
            name: 'The Button',
            icon: <FaRegArrowAltCircleRight size={50} color="white" />,
            path: '/dashboard/admin/the-button'
        }
    ];

    const handleModuleClick = (path: string) => {
        router.push(path);
    };

    return (
        <div className="bg-gray-200 min-h-screen p-8">
            <div className="grid grid-cols-4 gap-8 max-w-5xl mx-auto">
                {adminModules.map((module) => (
                    <div
                        key={module.id}
                        className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleModuleClick(module.path)}
                    >
                        {/* Module Icon - Black square with white icon */}
                        <div className="w-28 h-28 bg-black flex items-center justify-center mb-3 rounded-sm">
                            {module.icon}
                        </div>

                        {/* Module Name */}
                        <span className="text-base text-center text-black leading-tight">
                            {module.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}