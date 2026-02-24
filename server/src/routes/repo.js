import express from 'express';
import repoService from '../services/repoService.js';
import GitService from '../services/gitService.js';

const router = express.Router();

/**
 * GET /api/repos - Get all repositories
 */
router.get('/', async (req, res) => {
  try {
    const repos = await repoService.getAll();
    res.json({ success: true, repos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/repos/:id - Get repository by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const repo = await repoService.getById(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }
    res.json({ success: true, repo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/repos - Add a new repository
 */
router.post('/', async (req, res) => {
  try {
    const { path, name } = req.body;

    if (!path) {
      return res.status(400).json({ success: false, error: 'Path is required' });
    }

    const repo = await repoService.add(path, name);
    res.json({ success: true, repo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/repos/:id - Remove repository
 */
router.delete('/:id', async (req, res) => {
  try {
    await repoService.remove(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/repos/:id - Update repository
 */
router.put('/:id', async (req, res) => {
  try {
    const repo = await repoService.update(req.params.id, req.body);
    res.json({ success: true, repo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/repos/clone - Clone a repository
 */
router.post('/clone', async (req, res) => {
  try {
    const { url, path, name } = req.body;

    if (!url || !path) {
      return res.status(400).json({ success: false, error: 'URL and path are required' });
    }

    const repo = await repoService.clone(url, path, name);
    res.json({ success: true, repo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/repos/:id/status - Get repository status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const repo = await repoService.getById(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    const git = repoService.getGitService(repo.path);
    const status = await git.getStatus();

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/repos/:id/branches - Get repository branches
 */
router.get('/:id/branches', async (req, res) => {
  try {
    const repo = await repoService.getById(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    const git = repoService.getGitService(repo.path);
    const branches = await git.getBranches();

    res.json({ success: true, branches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/repos/:id/log - Get commit history
 */
router.get('/:id/log', async (req, res) => {
  try {
    const repo = await repoService.getById(req.params.id);
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    const git = repoService.getGitService(repo.path);
    const log = await git.getLog({
      maxCount: parseInt(req.query.limit) || 100
    });

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
