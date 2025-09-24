// app/dashboard/jobs/add/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';

// Define field type for typesafety
interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'file' | 'number' | 'url';
    required: boolean;
    visible: boolean;
    options?: string[]; // For select fields
    placeholder?: string;
    value: string;
}

interface CustomFieldDefinition {
    id: string;
    entity_type: string;
    field_name: string;
    field_label: string;
    field_type: string;
    is_required: boolean;
    is_hidden: boolean;
    sort_order: number;
    options?: string[];
    placeholder?: string;
    default_value?: string;
}

export default function AddJob() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id'); // Get job ID from URL if present

    // Add these state variables
    const [isEditMode, setIsEditMode] = useState(!!jobId);
    const [isLoadingJob, setIsLoadingJob] = useState(!!jobId);
    const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // This state will hold the dynamic form fields configuration
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
    const [jobDescFile, setJobDescFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with default fields and load custom fields
    useEffect(() => {
        initializeFields();
        loadCustomFields();
    }, []);

    const initializeFields = () => {
        // These are the standard fields
        const standardFields: FormField[] = [
            { id: 'jobTitle', name: 'jobTitle', label: 'Job Title', type: 'text', required: true, visible: true, value: '' },
            {
                id: 'category', name: 'category', label: 'Category', type: 'select', required: true, visible: true,
                options: ['Payroll', 'IT', 'Finance', 'Marketing', 'Human Resources', 'Operations', 'Sales'], value: 'Payroll'
            },
            { id: 'organization', name: 'organizationId', label: 'Organization', type: 'text', required: true, visible: true, value: '' },
            { id: 'hiringManager', name: 'hiringManager', label: 'Hiring Manager', type: 'text', required: true, visible: true, value: '' },
            {
                id: 'status',
                name: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                visible: true,
                options: ['Open', 'On Hold', 'Filled', 'Closed'],
                value: 'Open'
            },
            {
                id: 'priority',
                name: 'priority',
                label: 'Priority',
                type: 'select',
                required: true,
                visible: true,
                options: ['A', 'B', 'C'],
                value: 'A'
            },
            {
                id: 'employmentType',
                name: 'employmentType',
                label: 'Employment Type',
                type: 'select',
                required: true,
                visible: true,
                options: ['Full-time', 'Part-time', 'Contract', 'Temp to Hire', 'Temporary', 'Internship'],
                value: 'Temp to Hire'
            },
            { id: 'startDate', name: 'startDate', label: 'Start Date', type: 'date', required: false, visible: true, value: '' },
            {
                id: 'worksiteLocation', name: 'worksiteLocation', label: 'Worksite Location', type: 'text', required: false, visible: true,
                placeholder: 'Address, City, State, Zip', value: ''
            },
            {
                id: 'remoteOption', name: 'remoteOption', label: 'Remote Option', type: 'select', required: false, visible: true,
                options: ['On-site', 'Remote', 'Hybrid'], value: 'On-site'
            },
            { id: 'jobDescription', name: 'jobDescription', label: 'Job Description', type: 'textarea', required: true, visible: true, value: '' },
            { id: 'jobDescriptionFile', name: 'jobDescriptionFile', label: 'Upload Job Description', type: 'file', required: false, visible: true, value: '' },
            { id: 'minSalary', name: 'minSalary', label: 'Minimum Salary', type: 'number', required: false, visible: true, value: '', placeholder: 'e.g. 50000' },
            { id: 'maxSalary', name: 'maxSalary', label: 'Maximum Salary', type: 'number', required: false, visible: true, value: '', placeholder: 'e.g. 70000' },
            {
                id: 'benefits', name: 'benefits', label: 'Benefits', type: 'textarea', required: false, visible: true, value: '',
                placeholder: 'Enter benefits separated by new lines'
            },
            {
                id: 'requiredSkills', name: 'requiredSkills', label: 'Required Skills', type: 'textarea', required: false, visible: true, value: '',
                placeholder: 'Enter required skills separated by commas'
            },
            {
                id: 'jobBoardStatus', name: 'jobBoardStatus', label: 'Job Board Status', type: 'select', required: false, visible: true,
                options: ['Not Posted', 'Posted', 'Featured'], value: 'Not Posted'
            },
            { id: 'owner', name: 'owner', label: 'Owner', type: 'text', required: false, visible: true, value: 'Employee 1' },
            { id: 'dateAdded', name: 'dateAdded', label: 'Date Added', type: 'date', required: false, visible: true, value: new Date().toISOString().split('T')[0] },
        ];

        setFormFields(standardFields);
    };

    // Load custom field definitions from the API
    const loadCustomFields = async () => {
        setIsLoadingCustomFields(true);
        try {
            const response = await fetch('/api/admin/field-management/jobs');
            if (response.ok) {
                const data = await response.json();
                const customFields = data.customFields || [];
                setCustomFieldDefinitions(customFields);

                // Add custom fields to form fields
                addCustomFieldsToForm(customFields);
            } else {
                console.error('Failed to load custom fields');
            }
        } catch (error) {
            console.error('Error loading custom fields:', error);
        } finally {
            setIsLoadingCustomFields(false);
        }
    };

    // Add custom fields to the form
    const addCustomFieldsToForm = (customFields: CustomFieldDefinition[]) => {
        const customFormFields: FormField[] = customFields
            .filter(field => !field.is_hidden) // Only show visible fields
            .sort((a, b) => a.sort_order - b.sort_order) // Sort by sort_order
            .map(field => ({
                id: `custom_${field.field_name}`,
                name: field.field_name,
                label: field.field_label,
                type: mapFieldType(field.field_type),
                required: field.is_required,
                visible: !field.is_hidden,
                options: field.options || undefined,
                placeholder: field.placeholder || undefined,
                value: field.default_value || ''
            }));

        setFormFields(prevFields => [...prevFields, ...customFormFields]);
    };

    // Map custom field types to form field types
    const mapFieldType = (customType: string): FormField['type'] => {
        switch (customType) {
            case 'text':
            case 'email':
            case 'tel':
            case 'date':
            case 'textarea':
            case 'file':
            case 'number':
            case 'url':
                return customType as FormField['type'];
            case 'select':
            case 'radio':
                return 'select';
            case 'phone':
                return 'tel';
            default:
                return 'text';
        }
    };

    // Load job data when in edit mode
    useEffect(() => {
        if (jobId && formFields.length > 0) {
            fetchJobData(jobId);
        }
    }, [jobId, formFields.length]);

    // Function to fetch job data
    const fetchJobData = async (id: string) => {
        setIsLoadingJob(true);
        setLoadError(null);

        try {
            console.log(`Fetching job data for ID: ${id}`);
            const response = await fetch(`/api/jobs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch job details');
            }

            const data = await response.json();
            console.log("Job data received:", data);

            if (!data.job) {
                throw new Error('No job data received');
            }

            // Map API data to form fields
            const job = data.job;

            // Update formFields with existing job data
            setFormFields(prevFields => {
                const updatedFields = [...prevFields];

                // Helper function to find and update a field
                const updateField = (id: string, value: any) => {
                    const fieldIndex = updatedFields.findIndex(field => field.id === id);
                    if (fieldIndex !== -1) {
                        updatedFields[fieldIndex] = {
                            ...updatedFields[fieldIndex],
                            value: value !== null && value !== undefined ? String(value) : ''
                        };
                    }
                };

                // Update standard fields
                updateField('jobTitle', job.job_title);
                updateField('category', job.category);
                updateField('organization', job.organization_id || job.organization_name);
                updateField('hiringManager', job.hiring_manager);
                updateField('status', job.status);
                updateField('priority', job.priority);
                updateField('employmentType', job.employment_type);
                updateField('startDate', job.start_date ? job.start_date.split('T')[0] : '');
                updateField('worksiteLocation', job.worksite_location);
                updateField('remoteOption', job.remote_option);
                updateField('jobDescription', job.job_description);
                updateField('minSalary', job.min_salary);
                updateField('maxSalary', job.max_salary);
                updateField('benefits', job.benefits);
                updateField('requiredSkills', job.required_skills);
                updateField('jobBoardStatus', job.job_board_status);
                updateField('owner', job.owner);
                updateField('dateAdded', job.date_added ? job.date_added.split('T')[0] : '');

                // Handle custom fields if they exist
                if (job.custom_fields) {
                    let customFieldsObj = {};

                    try {
                        if (typeof job.custom_fields === 'string') {
                            customFieldsObj = JSON.parse(job.custom_fields);
                        } else if (typeof job.custom_fields === 'object') {
                            customFieldsObj = job.custom_fields;
                        }

                        // Update custom fields
                        Object.entries(customFieldsObj).forEach(([key, value]) => {
                            // Find the custom field by its original field name
                            const customFieldId = `custom_${key.replace(/\s+/g, '_').toLowerCase()}`;
                            updateField(customFieldId, value);
                        });
                    } catch (error) {
                        console.error('Error parsing custom fields:', error);
                    }
                }

                return updatedFields;
            });

            console.log('Job data loaded successfully');
        } catch (err) {
            console.error('Error fetching job:', err);
            setLoadError(err instanceof Error ? err.message : 'An error occurred while fetching job details');
        } finally {
            setIsLoadingJob(false);
        }
    };

    // Handle input change
    const handleChange = (id: string, value: string) => {
        setFormFields(formFields.map(field =>
            field.id === id ? { ...field, value } : field
        ));
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setJobDescFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            // Create an object with all field values (only the visible ones)
            const formData = formFields.reduce((acc, field) => {
                if (field.visible) {
                    acc[field.name] = field.value;
                }
                return acc;
            }, {} as Record<string, string>);

            // Separate custom fields
            const customFields: Record<string, string> = {};
            const standardData: Record<string, string> = {};

            formFields.forEach(field => {
                if (field.visible) {
                    if (field.id.startsWith('custom_')) {
                        // For custom fields, use the field label as the key
                        const customFieldDef = customFieldDefinitions.find(def => def.field_name === field.name);
                        const key = customFieldDef?.field_label || field.label;
                        customFields[key] = field.value;
                    } else {
                        standardData[field.name] = field.value;
                    }
                }
            });

            // Add custom fields to the standard data
            if (Object.keys(customFields).length > 0) {
                standardData.customFields = JSON.stringify(customFields);
            }

            console.log(`${isEditMode ? 'Updating' : 'Creating'} job data:`, standardData);

            // Choose the appropriate API endpoint and method based on whether we're editing or creating
            const url = isEditMode ? `/api/jobs/${jobId}` : '/api/jobs';
            const method = isEditMode ? 'PUT' : 'POST';

            // Send the data to the backend API
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                },
                body: JSON.stringify(standardData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} job`);
            }

            console.log(`Job ${isEditMode ? 'updated' : 'created'} successfully:`, data);

            // Navigate to the job view page
            const resultId = isEditMode ? jobId : (data.job ? data.job.id : null);
            if (resultId) {
                router.push('/dashboard/jobs/view?id=' + resultId);
            } else {
                // Fallback if we don't have an ID
                router.push('/dashboard/jobs');
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} job:`, error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    // Show loading screen when submitting
    if (isSubmitting) {
        return <LoadingScreen message={isEditMode ? "Updating job..." : "Creating job..."} />;
    }

    // Show loading screen when loading existing job data or custom fields
    if (isLoadingJob || isLoadingCustomFields) {
        return <LoadingScreen message="Loading job form..." />;
    }

    // Show error if job loading fails
    if (loadError) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-red-500 mb-4">{loadError}</div>
                <button
                    onClick={handleGoBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Jobs
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto py-4 px-4 sm:py-8 sm:px-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 relative">
                {/* Header with X button */}
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <div className="flex items-center">
                        <Image src="/window.svg" alt="Job" width={24} height={24} className="mr-2" />
                        <h1 className="text-xl font-bold">{isEditMode ? 'Edit' : 'Add'} Job</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/dashboard/admin/field-mapping?section=jobs')}
                            className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded"
                        >
                            Manage Fields
                        </button>
                        <button
                            onClick={handleGoBack}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <span className="text-2xl font-bold">X</span>
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
                        <p>{error}</p>
                    </div>
                )}

                {/* Custom Fields Info */}
                {customFieldDefinitions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 p-3 mb-4 rounded">
                        <p className="text-sm text-blue-700">
                            <strong>Custom Fields:</strong> {customFieldDefinitions.filter(f => !f.is_hidden).length} custom fields have been added to this form.
                            <button
                                onClick={() => router.push('/dashboard/admin/field-mapping?section=jobs')}
                                className="ml-2 text-blue-600 underline hover:text-blue-800"
                            >
                                Manage custom fields
                            </button>
                        </p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {formFields
                            .filter(field => field.visible)
                            .map((field, index) => (
                                <div key={field.id} className="flex items-center">
                                    {/* Field label */}
                                    <label className="w-48 font-medium">
                                        {field.label}:
                                        {field.id.startsWith('custom_') && (
                                            <span className="ml-1 text-xs text-blue-600">(Custom)</span>
                                        )}
                                    </label>

                                    {/* Field input */}
                                    <div className="flex-1 relative">
                                        {field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'url' ? (
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                value={field.value}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                                required={field.required}
                                            />
                                        ) : field.type === 'number' ? (
                                            <input
                                                type="number"
                                                name={field.name}
                                                value={field.value}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                                required={field.required}
                                            />
                                        ) : field.type === 'date' ? (
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name={field.name}
                                                    value={field.value}
                                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                                    className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                                    required={field.required}
                                                />
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <select
                                                name={field.name}
                                                value={field.value}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500 appearance-none"
                                                required={field.required}
                                            >
                                                {!field.required && <option value="">Select {field.label}</option>}
                                                {field.options?.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                name={field.name}
                                                value={field.value}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                rows={field.name === 'jobDescription' ? 5 : 3}
                                                placeholder={field.placeholder}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                                required={field.required}
                                            />
                                        ) : field.type === 'file' ? (
                                            <div>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={handleFileChange}
                                                    className="w-full p-2 text-gray-700"
                                                    required={field.required}
                                                />
                                                <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX</p>
                                            </div>
                                        ) : null}

                                        {field.required && (
                                            <span className="absolute text-red-500 left-[-10px] top-2">*</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Form Buttons */}
                    <div className="flex justify-end space-x-4 mt-8">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            {isEditMode ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}