'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import LoadingScreen from '@/components/LoadingScreen';

// Define field type for typesafety - Updated to include checkbox and other types
interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'file' | 'number' | 'url' | 'time' | 'checkbox';
    required: boolean;
    visible: boolean;
    options?: string[]; // For select fields
    placeholder?: string;
    value: string;
    checked?: boolean; // For checkbox fields
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

interface User {
    id: string;
    name: string;
    email: string;
}

export default function AddTask() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('id');

    const [isEditMode, setIsEditMode] = useState(!!taskId);
    const [isLoadingTask, setIsLoadingTask] = useState(!!taskId);
    const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
    const [activeUsers, setActiveUsers] = useState<User[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with default fields and load custom fields
    useEffect(() => {
        initializeFields();
        loadCustomFields();
        fetchActiveUsers();
    }, []);

    const initializeFields = () => {
        // Standard task fields
        const standardFields: FormField[] = [
            { id: 'title', name: 'title', label: 'Task Title', type: 'text', required: true, visible: true, value: '' },
            {
                id: 'status',
                name: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                visible: true,
                options: ['Open', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
                value: 'Open'
            },
            {
                id: 'priority',
                name: 'priority',
                label: 'Priority',
                type: 'select',
                required: true,
                visible: true,
                options: ['High', 'Medium', 'Low'],
                value: 'Medium'
            },
            {
                id: 'type',
                name: 'type',
                label: 'Type',
                type: 'select',
                required: true,
                visible: true,
                options: ['Follow-up', 'Email', 'Call', 'Meeting', 'Research', 'Other'],
                value: 'Follow-up'
            },
            { id: 'assignedTo', name: 'assignedTo', label: 'Assigned To', type: 'select', required: false, visible: true, value: '', options: [] },
            { id: 'dueDate', name: 'dueDate', label: 'Due Date', type: 'date', required: false, visible: true, value: '' },
            { id: 'dueTime', name: 'dueTime', label: 'Due Time', type: 'time', required: false, visible: true, value: '' },
            { id: 'description', name: 'description', label: 'Description', type: 'textarea', required: false, visible: true, value: '' },
            { id: 'notes', name: 'notes', label: 'Notes', type: 'textarea', required: false, visible: true, value: '' },
            { id: 'relatedEntity', name: 'relatedEntity', label: 'Related Entity', type: 'text', required: false, visible: true, value: '' },
            { id: 'relatedEntityId', name: 'relatedEntityId', label: 'Related Entity ID', type: 'text', required: false, visible: true, value: '' },
            { id: 'dateAdded', name: 'dateAdded', label: 'Date Added', type: 'date', required: false, visible: true, value: new Date().toISOString().split('T')[0] },
        ];

        setFormFields(standardFields);
    };

    // Fetch active users for assignment dropdown
    const fetchActiveUsers = async () => {
        try {
            const response = await fetch('/api/users/active');
            if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                setActiveUsers(users);

                // Update the assignedTo field options
                setFormFields(prev => prev.map(field =>
                    field.id === 'assignedTo'
                        ? { ...field, options: ['', ...users.map((u: User) => u.name)] }
                        : field
                ));
            }
        } catch (error) {
            console.error('Error fetching active users:', error);
        }
    };

    // Load custom field definitions from the API
    const loadCustomFields = async () => {
        setIsLoadingCustomFields(true);
        try {
            const response = await fetch('/api/admin/field-management/tasks');
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
            .filter(field => !field.is_hidden)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(field => ({
                id: `custom_${field.field_name}`,
                name: field.field_name,
                label: field.field_label,
                type: mapFieldType(field.field_type),
                required: field.is_required,
                visible: !field.is_hidden,
                options: field.options || undefined,
                placeholder: field.placeholder || undefined,
                value: field.default_value || '',
                checked: field.field_type === 'checkbox' ? false : undefined
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
            case 'time':
            case 'checkbox':
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

    // Load task data when in edit mode
    useEffect(() => {
        if (taskId && formFields.length > 0) {
            fetchTaskData(taskId);
        }
    }, [taskId, formFields.length]);

    // Function to fetch task data
    const fetchTaskData = async (id: string) => {
        setIsLoadingTask(true);
        setLoadError(null);

        try {
            console.log(`Fetching task data for ID: ${id}`);
            const response = await fetch(`/api/tasks/${id}`, {
                headers: {
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch task details');
            }

            const data = await response.json();
            console.log("Task data received:", data);

            if (!data.task) {
                throw new Error('No task data received');
            }

            // Map API data to form fields
            const task = data.task;

            setFormFields(prevFields => {
                const updatedFields = [...prevFields];

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
                updateField('title', task.title);
                updateField('status', task.status);
                updateField('priority', task.priority);
                updateField('type', task.type);
                updateField('assignedTo', task.assigned_to);
                updateField('dueDate', task.due_date ? task.due_date.split('T')[0] : '');
                updateField('dueTime', task.due_time);
                updateField('description', task.description);
                updateField('notes', task.notes);
                updateField('relatedEntity', task.related_entity);
                updateField('relatedEntityId', task.related_entity_id);
                updateField('dateAdded', task.date_added ? task.date_added.split('T')[0] : '');

                // Handle custom fields if they exist
                if (task.custom_fields) {
                    let customFieldsObj = {};

                    try {
                        if (typeof task.custom_fields === 'string') {
                            customFieldsObj = JSON.parse(task.custom_fields);
                        } else if (typeof task.custom_fields === 'object') {
                            customFieldsObj = task.custom_fields;
                        }

                        Object.entries(customFieldsObj).forEach(([key, value]) => {
                            const customFieldId = `custom_${key.replace(/\s+/g, '_').toLowerCase()}`;
                            updateField(customFieldId, value);
                        });
                    } catch (error) {
                        console.error('Error parsing custom fields:', error);
                    }
                }

                return updatedFields;
            });

            console.log('Task data loaded successfully');
        } catch (err) {
            console.error('Error fetching task:', err);
            setLoadError(err instanceof Error ? err.message : 'An error occurred while fetching task details');
        } finally {
            setIsLoadingTask(false);
        }
    };

    // Handle input change
    const handleChange = (id: string, value: string, checked?: boolean) => {
        setFormFields(formFields.map(field => {
            if (field.id === id) {
                if (field.type === 'checkbox') {
                    return { ...field, checked: checked ?? false };
                } else {
                    return { ...field, value };
                }
            }
            return field;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            // Create an object with all field values
            const formData = formFields.reduce((acc, field) => {
                if (field.visible) {
                    if (field.type === 'checkbox') {
                        acc[field.name] = field.checked ? 'true' : 'false';
                    } else {
                        acc[field.name] = field.value;
                    }
                }
                return acc;
            }, {} as Record<string, string>);

            // Separate custom fields
            const customFields: Record<string, string> = {};
            const standardData: Record<string, string> = {};

            formFields.forEach(field => {
                if (field.visible) {
                    const fieldValue = field.type === 'checkbox' ? (field.checked ? 'true' : 'false') : field.value;

                    if (field.id.startsWith('custom_')) {
                        const customFieldDef = customFieldDefinitions.find(def => def.field_name === field.name);
                        const key = customFieldDef?.field_label || field.label;
                        customFields[key] = fieldValue;
                    } else {
                        standardData[field.name] = fieldValue;
                    }
                }
            });

            // Add custom fields to the standard data
            if (Object.keys(customFields).length > 0) {
                standardData.customFields = JSON.stringify(customFields);
            }

            console.log(`${isEditMode ? 'Updating' : 'Creating'} task data:`, standardData);

            const url = isEditMode ? `/api/tasks/${taskId}` : '/api/tasks';
            const method = isEditMode ? 'PUT' : 'POST';

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
                throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} task`);
            }

            console.log(`Task ${isEditMode ? 'updated' : 'created'} successfully:`, data);

            const resultId = isEditMode ? taskId : (data.task ? data.task.id : null);
            if (resultId) {
                router.push('/dashboard/tasks/view?id=' + resultId);
            } else {
                router.push('/dashboard/tasks');
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} task:`, error);
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
        return <LoadingScreen message={isEditMode ? "Updating task..." : "Creating task..."} />;
    }

    // Show loading screen when loading existing task data or custom fields
    if (isLoadingTask || isLoadingCustomFields) {
        return <LoadingScreen message="Loading task form..." />;
    }

    // Show error if task loading fails
    if (loadError) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-red-500 mb-4">{loadError}</div>
                <button
                    onClick={handleGoBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Tasks
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
                        <Image src="/checklist.svg" alt="Task" width={24} height={24} className="mr-2" />
                        <h1 className="text-xl font-bold">{isEditMode ? 'Edit' : 'Add'} Task</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/dashboard/admin/field-mapping?section=tasks')}
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
                                onClick={() => router.push('/dashboard/admin/field-mapping?section=tasks')}
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
                            .map((field) => (
                                <div key={field.id} className="flex items-center">
                                    <label className="w-48 font-medium">
                                        {field.label}:
                                        {field.id.startsWith('custom_') && (
                                            <span className="ml-1 text-xs text-blue-600">(Custom)</span>
                                        )}
                                    </label>

                                    <div className="flex-1 relative">
                                        {field.type === 'checkbox' ? (
                                            <input
                                                type="checkbox"
                                                name={field.name}
                                                checked={field.checked || false}
                                                onChange={(e) => handleChange(field.id, '', e.target.checked)}
                                                className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                                required={field.required}
                                            />
                                        ) : field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'url' ? (
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
                                        ) : field.type === 'date' || field.type === 'time' ? (
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                value={field.value}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                                                required={field.required}
                                            />
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
                                                rows={3}
                                                placeholder={field.placeholder}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                                required={field.required}
                                            />
                                        ) : field.type === 'file' ? (
                                            <input
                                                type="file"
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                className="w-full p-2 text-gray-700"
                                                required={field.required}
                                            />
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