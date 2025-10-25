import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authenticateApiKey } from '../middleware/api-key';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../services/task.service';

const router = Router();

/**
 * Middleware to handle both JWT and API Key authentication
 */
const authenticateEither = (req: Request, res: Response, next: any) => {
  // Check if Authorization header (JWT) or X-API-Key header exists
  const hasJWT = req.headers.authorization?.startsWith('Bearer ');
  const hasAPIKey = req.headers['x-api-key'];

  if (hasJWT) {
    // Use JWT authentication
    authenticate(req, res, next);
  } else if (hasAPIKey) {
    // Use API Key authentication
    authenticateApiKey(req, res, next);
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

/**
 * Get user ID from either JWT or API Key auth
 */
const getUserId = (req: Request): number => {
  if (req.user) {
    return req.user.id; // From JWT
  } else if (req.apiKeyUser) {
    return req.apiKeyUser.user_id; // From API Key
  }
  throw new Error('No authenticated user');
};

/**
 * GET /tasks
 * Get all tasks for the authenticated user
 * Protected by JWT or API Key authentication
 */
router.get('/', authenticateEither, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 GET /tasks - User authenticated:', req.user ? `JWT user ${req.user.id}` : req.apiKeyUser ? `API key user ${req.apiKeyUser.user_id}` : 'NONE');
    
    const userId = getUserId(req);
    console.log('📋 Fetching tasks for user ID:', userId);
    
    const { status } = req.query;
    const tasks = await getTasks(userId, status as string | undefined);
    
    console.log(`✅ Found ${tasks.length} tasks for user ${userId}`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /tasks/:id
 * Get a specific task by ID
 * Protected by JWT or API Key authentication
 */
router.get('/:id', authenticateEither, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const task = await getTaskById(parseInt(req.params.id), userId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /tasks
 * Create a new task
 * Protected by JWT or API Key authentication
 */
router.post('/', authenticateEither, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { title, description, priority, tags } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const task = await createTask({
      user_id: userId,
      title,
      description,
      priority: priority || 'medium',
      tags: tags || [],
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /tasks/:id
 * Update an existing task
 * Protected by JWT or API Key authentication
 */
router.put('/:id', authenticateEither, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { title, description, status, priority } = req.body;

    const task = await updateTask(parseInt(req.params.id), userId, {
      title,
      description,
      status,
      priority,
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /tasks/:id
 * Delete a task
 * Protected by JWT or API Key authentication
 */
router.delete('/:id', authenticateEither, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const success = await deleteTask(parseInt(req.params.id), userId);

    if (!success) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

