/**
 * Task Management Type Definitions
 */

import { Task } from '../api/types';

/**
 * Grouped tasks by status for Kanban display
 */
export interface GroupedTasks {
    todo: Task[];
    in_progress: Task[];
    review: Task[];
    done: Task[];
}

/**
 * Loading state for task operations
 */
export interface TaskLoadingState {
    isLoading: boolean;
    operation?: 'fetching' | 'creating' | 'updating' | 'deleting' | 'reopening' | 'refreshing';
}

/**
 * Task creation input
 */
export interface TaskCreationInput {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
}







