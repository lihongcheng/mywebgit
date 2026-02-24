import express from 'express';
import repoService from '../services/repoService.js';

const router = express.Router();

// Middleware to get repo from query or body
const getRepoMiddleware = async (req, res, next) => {
  try {
    const repoId = req.query.repoId || req.body.repoId;
    if (!repoId) {
      return res.status(400).json({ success: false, error: 'repoId is required' });
    }

    const repo = await repoService.getById(repoId);
    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    req.repo = repo;
    req.git = repoService.getGitService(repo.path);
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/git/status - Get repository status
 */
router.get('/status', getRepoMiddleware, async (req, res) => {
  try {
    const status = await req.git.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/add - Stage files
 */
router.post('/add', getRepoMiddleware, async (req, res) => {
  try {
    const { files } = req.body;
    await req.git.add(files);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/reset - Unstage files
 */
router.post('/reset', getRepoMiddleware, async (req, res) => {
  try {
    const { files } = req.body;
    await req.git.reset(files);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/commit - Commit changes
 */
router.post('/commit', getRepoMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Commit message is required' });
    }
    const result = await req.git.commit(message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/push - Push to remote
 */
router.post('/push', getRepoMiddleware, async (req, res) => {
  try {
    const { remote, branch, setUpstream } = req.body;
    const result = await req.git.push(remote || 'origin', branch, { setUpstream });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/pull - Pull from remote
 */
router.post('/pull', getRepoMiddleware, async (req, res) => {
  try {
    const { remote, branch } = req.body;
    const result = await req.git.pull(remote || 'origin', branch);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/fetch - Fetch from remote
 */
router.post('/fetch', getRepoMiddleware, async (req, res) => {
  try {
    const { remote } = req.body;
    await req.git.fetch(remote || 'origin');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/prune - Prune stale remote-tracking branches
 */
router.post('/prune', getRepoMiddleware, async (req, res) => {
  try {
    const { remote } = req.body;
    await req.git.prune(remote || 'origin');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/stale-branches - Get stale local branches
 */
router.get('/stale-branches', getRepoMiddleware, async (req, res) => {
  try {
    const { remote } = req.query;
    const result = await req.git.getStaleBranches(remote || 'origin');
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/delete-branches - Delete multiple local branches
 */
router.post('/delete-branches', getRepoMiddleware, async (req, res) => {
  try {
    const { branches, force } = req.body;
    if (!branches || !Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({ success: false, error: 'Branches array is required' });
    }
    const result = await req.git.deleteBranches(branches, force);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/branches - Get branches
 */
router.get('/branches', getRepoMiddleware, async (req, res) => {
  try {
    const branches = await req.git.getBranches();
    res.json({ success: true, branches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/branch - Create branch
 */
router.post('/branch', getRepoMiddleware, async (req, res) => {
  try {
    const { name, startPoint } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    const result = await req.git.createBranch(name, startPoint);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/git/branch - Delete branch
 */
router.delete('/branch', getRepoMiddleware, async (req, res) => {
  try {
    const { name, force } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    await req.git.deleteBranch(name, force);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/checkout - Switch branch
 */
router.post('/checkout', getRepoMiddleware, async (req, res) => {
  try {
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    await req.git.checkout(branch);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/rename-branch - Rename branch
 */
router.post('/rename-branch', getRepoMiddleware, async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ success: false, error: 'Both old and new names are required' });
    }
    await req.git.renameBranch(oldName, newName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/log - Get commit history
 */
router.get('/log', getRepoMiddleware, async (req, res) => {
  try {
    const log = await req.git.getLog({
      maxCount: parseInt(req.query.limit) || 100
    });
    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/diff - Get diff
 */
router.get('/diff', getRepoMiddleware, async (req, res) => {
  try {
    const { cached, file, commit1, commit2 } = req.query;
    const diff = await req.git.getDiff({
      cached: cached === 'true',
      file,
      commit1,
      commit2
    });
    res.json({ success: true, diff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/diff-summary - Get diff summary
 */
router.get('/diff-summary', getRepoMiddleware, async (req, res) => {
  try {
    const { cached } = req.query;
    const summary = await req.git.getDiffSummary({
      cached: cached === 'true'
    });
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/merge - Merge branch
 */
router.post('/merge', getRepoMiddleware, async (req, res) => {
  try {
    const { branch, noFF, squash } = req.body;
    if (!branch) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    const result = await req.git.merge(branch, { noFF, squash });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/rebase - Rebase
 */
router.post('/rebase', getRepoMiddleware, async (req, res) => {
  try {
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }
    const result = await req.git.rebase(branch);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/rebase/abort - Abort rebase
 */
router.post('/rebase/abort', getRepoMiddleware, async (req, res) => {
  try {
    await req.git.rebaseAbort();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/rebase/continue - Continue rebase
 */
router.post('/rebase/continue', getRepoMiddleware, async (req, res) => {
  try {
    await req.git.rebaseContinue();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/stash - Stash operations
 */
router.post('/stash', getRepoMiddleware, async (req, res) => {
  try {
    const { message, pop, apply, drop, index } = req.body;
    await req.git.stash({ message, pop, apply, drop, index });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/stash/list - Get stash list
 */
router.get('/stash/list', getRepoMiddleware, async (req, res) => {
  try {
    const result = await req.git.getStashList();
    res.json({ success: true, stashes: result.stashes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/tag - Create tag
 */
router.post('/tag', getRepoMiddleware, async (req, res) => {
  try {
    const { name, message, commit } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Tag name is required' });
    }
    await req.git.createTag(name, message, commit);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/git/tag - Delete tag
 */
router.delete('/tag', getRepoMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Tag name is required' });
    }
    await req.git.deleteTag(name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/tags - Get tags
 */
router.get('/tags', getRepoMiddleware, async (req, res) => {
  try {
    const result = await req.git.getTags();
    res.json({ success: true, tags: result.tags, latest: result.latest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/reset - Reset to commit
 */
router.post('/reset', getRepoMiddleware, async (req, res) => {
  try {
    const { commit, mode } = req.body;
    if (!commit) {
      return res.status(400).json({ success: false, error: 'Commit is required' });
    }
    await req.git.resetTo(commit, mode || 'mixed');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/git/revert - Revert commit
 */
router.post('/revert', getRepoMiddleware, async (req, res) => {
  try {
    const { commit, noCommit } = req.body;
    if (!commit) {
      return res.status(400).json({ success: false, error: 'Commit is required' });
    }
    await req.git.revert(commit, noCommit);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/git/remotes - Get remotes
 */
router.get('/remotes', getRepoMiddleware, async (req, res) => {
  try {
    const result = await req.git.getRemotes();
    res.json({ success: true, remotes: result.remotes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
