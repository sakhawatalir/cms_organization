'use client'

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DataUploader() {
    const router = useRouter();
    const [recordType, setRecordType] = useState('Contact');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('No file chosen');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const recordTypes = [
        'Contact',
        'Organization',
        'Job Seeker',
        'Job',
        'Hiring Manager',
        'Placement',
        'Lead'
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setFileName(e.target.files[0].name);
        }
    };

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleContinue = async () => {
        if (!selectedFile) {
            alert('Please select a CSV file first');
            return;
        }

        try {
            // In a real implementation, you would upload the file here
            // For now, we'll just simulate a successful upload
            console.log('Selected record type:', recordType);
            console.log('Selected file:', selectedFile);

            // Navigate to the next step or show success message
            // For demo purposes, we'll navigate to the file-type page
            router.push('/dashboard/parse/file-type');
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('There was an error uploading your file. Please try again.');
        }
    };

    return (
        <div className="bg-gray-200 min-h-screen p-8">
            <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
                <h1 className="text-2xl font-semibold mb-8">Uploader</h1>

                <div className="space-y-6">
                    {/* Record Type Selection */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-gray-600">Record Type:</label>
                        <div className="text-gray-500 text-sm">Choose which category of records you would like to import.</div>
                        <select
                            value={recordType}
                            onChange={(e) => setRecordType(e.target.value)}
                            className="w-full md:w-64 border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {recordTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* File Upload */}
                    <div className="flex flex-col space-y-2">
                        <label className="text-gray-600">CSV File:</label>
                        <div className="text-gray-500 text-sm">Select the .csv file containing the data you would like to import.</div>
                        <div className="flex items-center space-x-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={handleChooseFile}
                                className="bg-gray-100 border border-gray-300 rounded px-4 py-2 hover:bg-gray-200"
                            >
                                Choose File
                            </button>
                            <span className="text-sm text-gray-600">{fileName}</span>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleContinue}
                            disabled={!selectedFile}
                            className={`px-6 py-2 rounded text-white ${selectedFile ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}