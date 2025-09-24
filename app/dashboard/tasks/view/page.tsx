'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ActionDropdown from '@/components/ActionDropdown';
import LoadingScreen from '@/components/LoadingScreen';

export default function TaskView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('summary');

    // Add states for task data
    const [task, setTask] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Notes and history state
    const [notes, setNotes] = useState<Array<any>>([]);
    const [history, setHistory] = useState<Array<any>>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showAddNote, setShowAddNote] = useState(false);
    const [newNote, setNewNote] = useState('');

    const taskId = searchParams.get('id');

    // Fetch task when component mounts
    useEffect(() => {
        if (taskId) {
            fetchTask(taskId);
        }
    }, [taskId]);

    // Function to fetch task data with better error handling
    const fetchTask = async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log(`Fetching task data for ID: ${id}`);
            const response = await fetch(`/api/tasks/${id}`, {
                headers: {
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                }
            });

            console.log(`API Response status: ${response.status}`);

            // Handle non-JSON responses
            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (error) {
                const parseError = error as Error;
                console.error('Error parsing response:', parseError);
                console.error('Raw response:', responseText.substring(0, 200));
                throw new Error(`Failed to parse API response: ${parseError.message}`);
            }

            if (!response.ok) {
                throw new Error(data.message || `Failed to fetch task: ${response.status}`);
            }

            console.log('Task data received:', data);

            // Validate task data
            if (!data.task) {
                throw new Error('No task data received from API');
            }

            // Format the task data for display with defensive coding
            let customFieldsObj = {};

            // Safely parse custom_fields if it exists
            if (data.task.custom_fields) {
                try {
                    // Handle both string and object formats
                    if (typeof data.task.custom_fields === 'string') {
                        customFieldsObj = JSON.parse(data.task.custom_fields);
                    } else if (typeof data.task.custom_fields === 'object') {
                        customFieldsObj = data.task.custom_fields;
                    }
                } catch (error) {
                    const parseError = error as Error;
                    console.error('Error parsing custom fields:', parseError);
                    customFieldsObj = {}; // Default to empty object if parsing fails
                }
            }

            // Format the task data with default values for all fields
            const formattedTask = {
                id: data.task.id || 'Unknown ID',
                title: data.task.title || 'Untitled Task',
                description: data.task.description || 'No description provided',
                isCompleted: data.task.is_completed || false,
                dueDate: data.task.due_date ? new Date(data.task.due_date).toLocaleDateString() : 'Not set',
                dueTime: data.task.due_time || 'Not set',
                dueDateTimeFormatted: data.task.due_date
                    ? `${new Date(data.task.due_date).toLocaleDateString()}${data.task.due_time ? ` ${data.task.due_time}` : ''}`
                    : 'Not set',
                priority: data.task.priority || 'Medium',
                status: data.task.status || 'Pending',
                owner: data.task.owner || 'Not assigned',
                assignedTo: data.task.assigned_to_name || 'Not assigned',
                assignedToId: data.task.assigned_to,
                jobSeeker: data.task.job_seeker_name || 'Not specified',
                jobSeekerId: data.task.job_seeker_id,
                hiringManager: data.task.hiring_manager_name || 'Not specified',
                hiringManagerId: data.task.hiring_manager_id,
                job: data.task.job_title || 'Not specified',
                jobId: data.task.job_id,
                lead: data.task.lead_name || 'Not specified',
                leadId: data.task.lead_id,
                placement: data.task.placement_id ? `Placement #${data.task.placement_id}` : 'Not specified',
                placementId: data.task.placement_id,
                dateCreated: data.task.created_at ? new Date(data.task.created_at).toLocaleDateString() : 'Unknown',
                createdBy: data.task.created_by_name || 'Unknown',
                completedAt: data.task.completed_at ? new Date(data.task.completed_at).toLocaleDateString() : null,
                completedBy: data.task.completed_by_name || null,
                customFields: customFieldsObj // Use our properly parsed object
            };

            console.log('Formatted task data:', formattedTask);
            setTask(formattedTask);

            // Now fetch notes and history
            fetchNotes(id);
            fetchHistory(id);
        } catch (err) {
            console.error('Error fetching task:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching task details');
        } finally {
            setIsLoading(false);
        }
    };

    // Custom fields section with proper type handling
    const renderCustomFields = () => {
        if (!task || !task.customFields) return null;

        const customFieldKeys = Object.keys(task.customFields);
        if (customFieldKeys.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Additional Information</h3>
                <ul className="list-inside">
                    {Object.entries(task.customFields).map(([key, value]) => (
                        <li key={key} className="mb-1 text-gray-700">
                            <span className="font-medium">{key}:</span> {String(value || '')}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Fetch notes for the task
    const fetchNotes = async (id: string) => {
        setIsLoadingNotes(true);

        try {
            const response = await fetch(`/api/tasks/${id}/notes`, {
                headers: {
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }

            const data = await response.json();
            setNotes(data.notes || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setIsLoadingNotes(false);
        }
    };

    // Fetch history for the task
    const fetchHistory = async (id: string) => {
        setIsLoadingHistory(true);

        try {
            const response = await fetch(`/api/tasks/${id}/history`, {
                headers: {
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }

            const data = await response.json();
            setHistory(data.history || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Handle adding a new note
    const handleAddNote = async () => {
        if (!newNote.trim() || !taskId) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                },
                body: JSON.stringify({ text: newNote })
            });

            if (!response.ok) {
                throw new Error('Failed to add note');
            }

            const data = await response.json();

            // Add the new note to the list
            setNotes([data.note, ...notes]);

            // Clear the form
            setNewNote('');
            setShowAddNote(false);

            // Refresh history
            fetchHistory(taskId);
        } catch (err) {
            console.error('Error adding note:', err);
            alert('Failed to add note. Please try again.');
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const handleEdit = () => {
        if (taskId) {
            router.push(`/dashboard/tasks/add?id=${taskId}`);
        }
    };

    const handleActionSelected = (action: string) => {
        console.log(`Action selected: ${action}`);
        if (action === 'edit') {
            handleEdit();
        } else if (action === 'delete' && taskId) {
            handleDelete(taskId);
        } else if (action === 'complete' && taskId) {
            handleToggleComplete(taskId, false);
        } else if (action === 'incomplete' && taskId) {
            handleToggleComplete(taskId, true);
        }
    };

    // Handle task deletion
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            // Redirect to the tasks list
            router.push('/dashboard/tasks');
        } catch (error) {
            console.error('Error deleting task:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while deleting the task');
            setIsLoading(false);
        }
    };

    // Handle task completion toggle
    const handleToggleComplete = async (id: string, currentlyCompleted: boolean) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1")}`
                },
                body: JSON.stringify({
                    isCompleted: !currentlyCompleted,
                    status: !currentlyCompleted ? 'Completed' : 'Pending'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            // Refresh the task data
            fetchTask(id);
        } catch (error) {
            console.error('Error updating task:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while updating the task');
        }
    };

    const actionOptions = [
        { label: 'Edit', action: () => handleActionSelected('edit') },
        {
            label: task?.isCompleted ? 'Mark Incomplete' : 'Mark Complete',
            action: () => handleActionSelected(task?.isCompleted ? 'incomplete' : 'complete')
        },
        { label: 'Delete', action: () => handleActionSelected('delete') },
        { label: 'Clone', action: () => handleActionSelected('clone') },
    ];

    // Tabs from the design
    const tabs = [
        { id: 'summary', label: 'Summary' },
        { id: 'modify', label: 'Modify' },
        { id: 'history', label: 'History' },
        { id: 'notes', label: 'Notes' },
    ];

    // Render notes tab content
    const renderNotesTab = () => (
        <div className="bg-white p-4 rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Task Notes</h2>
                <button
                    onClick={() => setShowAddNote(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    Add Note
                </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
                <div className="mb-6 p-4 bg-gray-50 rounded border">
                    <h3 className="font-medium mb-2">Add New Note</h3>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter your note here..."
                        className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowAddNote(false)}
                            className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-100 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddNote}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            disabled={!newNote.trim()}
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            )}

            {/* Notes List */}
            {isLoadingNotes ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : notes.length > 0 ? (
                <div className="space-y-4">
                    {notes.map((note) => (
                        <div key={note.id} className="p-3 border rounded hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-blue-600">{note.created_by_name || 'Unknown User'}</span>
                                <span className="text-sm text-gray-500">
                                    {new Date(note.created_at).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-gray-700">{note.text}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 italic">No notes have been added yet.</p>
            )}
        </div>
    );

    // Render history tab content
    const renderHistoryTab = () => (
        <div className="bg-white p-4 rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Task History</h2>

            {isLoadingHistory ? (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : history.length > 0 ? (
                <div className="space-y-4">
                    {history.map((item) => {
                        // Format the history entry based on action type
                        let actionDisplay = '';
                        let detailsDisplay = '';

                        try {
                            const details = typeof item.details === 'string'
                                ? JSON.parse(item.details)
                                : item.details;

                            switch (item.action) {
                                case 'CREATE':
                                    actionDisplay = 'Task Created';
                                    detailsDisplay = `Created by ${item.performed_by_name || 'Unknown'}`;
                                    break;
                                case 'UPDATE':
                                    actionDisplay = 'Task Updated';
                                    if (details && details.before && details.after) {
                                        // Create a list of changes
                                        const changes = [];
                                        for (const key in details.after) {
                                            if (details.before[key] !== details.after[key]) {
                                                const fieldName = key.replace(/_/g, ' ');
                                                changes.push(`${fieldName}: "${details.before[key] || ''}" → "${details.after[key] || ''}"`);
                                            }
                                        }
                                        if (changes.length > 0) {
                                            detailsDisplay = `Changes: ${changes.join(', ')}`;
                                        } else {
                                            detailsDisplay = 'No changes detected';
                                        }
                                    }
                                    break;
                                case 'ADD_NOTE':
                                    actionDisplay = 'Note Added';
                                    detailsDisplay = details.text || '';
                                    break;
                                default:
                                    actionDisplay = item.action;
                                    detailsDisplay = JSON.stringify(details);
                            }
                        } catch (e) {
                            console.error('Error parsing history details:', e);
                            detailsDisplay = 'Error displaying details';
                        }

                        return (
                            <div key={item.id} className="p-3 border rounded hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-blue-600">{actionDisplay}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(item.performed_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="mb-2">{detailsDisplay}</div>
                                <div className="text-sm text-gray-600">
                                    By: {item.performed_by_name || 'Unknown'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-500 italic">No history records available</p>
            )}
        </div>
    );

    // Modified the Modify tab to directly use handleEdit
    const renderModifyTab = () => (
        <div className="bg-white p-4 rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
            <p className="text-gray-600 mb-4">Click the button below to edit this task's details.</p>
            <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Edit Task
            </button>
        </div>
    );

    if (isLoading) {
        return <LoadingScreen message="Loading task details..." />;
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                    onClick={handleGoBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Tasks
                </button>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-gray-700 mb-4">Task not found</div>
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
        <div className="bg-gray-200 min-h-screen">
            {/* Header with logo and task title */}
            <div className="bg-green-200 p-2 flex items-center">
                <div className="flex items-center">
                    <Image src="/window.svg" alt="Tasks" width={24} height={24} className="mr-2" />
                    <h1 className="text-xl text-gray-700">Tasks</h1>
                </div>
            </div>

            {/* Sub-header with ID and title */}
            <div className="bg-white border-b border-gray-300 p-2">
                <div className="text-lg font-semibold">{task.id}</div>
                <div className="text-lg">{task.title}</div>
                <div className="text-sm text-gray-500">
                    Status: <span className={`px-2 py-1 rounded text-xs ${task.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {task.isCompleted ? 'Completed' : task.status}
                    </span>
                </div>
            </div>

            {/* Actions row */}
            <div className="bg-white border-b border-gray-300 p-3 flex justify-between items-center">
                <div className="flex space-x-3">
                    {/* Priority tag */}
                    <span className={`text-xs px-2 py-1 rounded ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                        }`}>
                        {task.priority} Priority
                    </span>
                    {/* Completion status */}
                    <span className={`text-xs px-2 py-1 rounded ${task.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {task.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2">
                    <ActionDropdown
                        label="ACTIONS"
                        options={actionOptions}
                    />
                    <button className="p-1 hover:bg-gray-200 rounded">
                        <Image src="/print.svg" alt="Print" width={20} height={20} />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                        <Image src="/reload.svg" alt="Reload" width={20} height={20} />
                    </button>
                    <button onClick={handleGoBack} className="p-1 hover:bg-gray-200 rounded">
                        <Image src="/x.svg" alt="Close" width={20} height={20} />
                    </button>
                </div>
            </div>

            {/* Information row */}
            <div className="bg-white border-b border-gray-300 p-2 grid grid-cols-4 gap-4">
                <div>
                    <div className="text-gray-600 text-sm">ID</div>
                    <div>{task.id}</div>
                </div>
                <div>
                    <div className="text-gray-600 text-sm">Title</div>
                    <div>{task.title}</div>
                </div>
                <div>
                    <div className="text-gray-600 text-sm">Due Date</div>
                    <div>{task.dueDateTimeFormatted}</div>
                </div>
                <div>
                    <div className="text-gray-600 text-sm">Owner</div>
                    <div>{task.owner}</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white border-b border-gray-300 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 ${activeTab === tab.id
                            ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-7 gap-4 p-4">
                {/* Display content based on active tab */}
                {activeTab === 'summary' && (
                    <>
                        {/* Left Column - Task Details (4/7 width) */}
                        <div className="col-span-4">
                            <div className="bg-white rounded-lg shadow">
                                <div className="border-b border-gray-300 p-4 font-medium">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold">{task.title}</h2>
                                        <div className={`text-xs px-2 py-1 rounded ${task.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {task.isCompleted ? 'Completed' : task.status}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Due: {task.dueDateTimeFormatted} • Priority: {task.priority}
                                    </div>
                                </div>
                                <div className="p-4">
                                    {/* Task Description */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-lg mb-2">Description</h3>
                                        <div className="whitespace-pre-line text-gray-700">
                                            {task.description}
                                        </div>
                                    </div>

                                    {/* Custom fields section */}
                                    {renderCustomFields()}

                                    {/* Related Records */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-lg mb-2">Related Records</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p><span className="font-medium">Job Seeker:</span> {task.jobSeeker}</p>
                                                <p><span className="font-medium">Hiring Manager:</span> {task.hiringManager}</p>
                                            </div>
                                            <div>
                                                <p><span className="font-medium">Job:</span> {task.job}</p>
                                                <p><span className="font-medium">Lead:</span> {task.lead}</p>
                                            </div>
                                        </div>
                                        {task.placement !== 'Not specified' && (
                                            <p className="mt-2"><span className="font-medium">Placement:</span> {task.placement}</p>
                                        )}
                                    </div>

                                    {/* Completion Info */}
                                    {task.isCompleted && task.completedAt && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-lg mb-2">Completion Details</h3>
                                            <div className="bg-green-50 p-3 rounded">
                                                <p><span className="font-medium">Completed on:</span> {task.completedAt}</p>
                                                {task.completedBy && (
                                                    <p><span className="font-medium">Completed by:</span> {task.completedBy}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Task Details (3/7 width) */}
                        <div className="col-span-3 space-y-4">
                            {/* Details Panel */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="border-b border-gray-300 p-2 font-medium">
                                    Details
                                </div>
                                <div className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Status:</div>
                                            <div className="flex-1">
                                                <span className={`px-2 py-1 rounded text-sm ${task.isCompleted ? 'bg-green-100 text-green-800' :
                                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {task.isCompleted ? 'Completed' : task.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Priority:</div>
                                            <div className="flex-1">
                                                <span className={`px-2 py-1 rounded text-sm ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Due Date:</div>
                                            <div className="flex-1">{task.dueDate}</div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Due Time:</div>
                                            <div className="flex-1">{task.dueTime}</div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Owner:</div>
                                            <div className="flex-1">{task.owner}</div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Assigned To:</div>
                                            <div className="flex-1">{task.assignedTo}</div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Created:</div>
                                            <div className="flex-1">{task.dateCreated}</div>
                                        </div>

                                        <div className="flex">
                                            <div className="w-32 text-gray-600">Created By:</div>
                                            <div className="flex-1">{task.createdBy}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Notes Section */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="border-b border-gray-300 p-2 font-medium">
                                    Recent Notes
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-end mb-3">
                                        <button
                                            onClick={() => setShowAddNote(true)}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Add Note
                                        </button>
                                    </div>

                                    {/* Notes preview */}
                                    {notes.length > 0 ? (
                                        <div>
                                            {notes.slice(0, 2).map(note => (
                                                <div key={note.id} className="mb-3 pb-3 border-b last:border-0">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="font-medium">{note.created_by_name || 'Unknown User'}</span>
                                                        <span className="text-gray-500">{new Date(note.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">
                                                        {note.text.length > 100 ? `${note.text.substring(0, 100)}...` : note.text}
                                                    </p>
                                                </div>
                                            ))}
                                            {notes.length > 2 && (
                                                <button
                                                    onClick={() => setActiveTab('notes')}
                                                    className="text-blue-500 text-sm hover:underline"
                                                >
                                                    View all {notes.length} notes
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 p-4">
                                            No notes have been added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                    <div className="col-span-7">
                        {renderNotesTab()}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="col-span-7">
                        {renderHistoryTab()}
                    </div>
                )}

                {/* Modify Tab */}
                {activeTab === 'modify' && (
                    <div className="col-span-7">
                        {renderModifyTab()}
                    </div>
                )}
            </div>
        </div>
    );
}