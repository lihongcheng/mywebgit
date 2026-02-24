import { useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { repoApi, gitApi } from '../services/api';

// Simple notification helper
const notify = {
  success: (msg) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="position:fixed;top:16px;right:16px;padding:12px 24px;background:#52c41a;color:#fff;border-radius:4px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.15)">${msg}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
  error: (msg) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="position:fixed;top:16px;right:16px;padding:12px 24px;background:#ff4d4f;color:#fff;border-radius:4px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.15);max-width:400px">${msg}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
};

/**
 * Hook for repository operations
 */
export function useRepo() {
  const {
    repos,
    setRepos,
    currentRepo,
    setCurrentRepo,
    loading,
    setLoading,
    setError
  } = useAppStore();

  const hasAutoSelected = useRef(false);

  const loadRepos = useCallback(async () => {
    setLoading('repos', true);
    try {
      const result = await repoApi.getAll();
      setRepos(result.repos);

      // Auto-select first valid repo only once
      if (!hasAutoSelected.current && result.repos.length > 0) {
        const validRepo = result.repos.find(r => r.valid);
        if (validRepo && !currentRepo) {
          setCurrentRepo(validRepo);
        }
        hasAutoSelected.current = true;
      }
    } catch (error) {
      setError(error.message);
      notify.error(`Failed to load repositories: ${error.message}`);
    } finally {
      setLoading('repos', false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRepos, setCurrentRepo, setLoading, setError]);

  const addRepo = useCallback(async (path, name) => {
    try {
      const result = await repoApi.add(path, name);
      await loadRepos();
      notify.success('Repository added successfully');
      return result.repo;
    } catch (error) {
      notify.error(`Failed to add repository: ${error.message}`);
      throw error;
    }
  }, [loadRepos]);

  const removeRepo = useCallback(async (id) => {
    try {
      await repoApi.remove(id);
      if (currentRepo?.id === id) {
        setCurrentRepo(null);
        hasAutoSelected.current = false;
      }
      await loadRepos();
      notify.success('Repository removed');
    } catch (error) {
      notify.error(`Failed to remove repository: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadRepos, setCurrentRepo]);

  const selectRepo = useCallback((repo) => {
    setCurrentRepo(repo);
  }, [setCurrentRepo]);

  return {
    repos,
    currentRepo,
    loading: loading.repos,
    loadRepos,
    addRepo,
    removeRepo,
    selectRepo
  };
}

/**
 * Hook for git status operations
 */
export function useGitStatus() {
  const {
    currentRepo,
    status,
    setStatus,
    loading,
    setLoading
  } = useAppStore();

  const loadStatus = useCallback(async () => {
    if (!currentRepo) return;

    setLoading('status', true);
    try {
      const result = await gitApi.getStatus(currentRepo.id);
      setStatus(result.status);
    } catch (error) {
      notify.error(`Failed to get status: ${error.message}`);
    } finally {
      setLoading('status', false);
    }
  }, [currentRepo?.id, setLoading, setStatus]);

  const stageFiles = useCallback(async (files) => {
    if (!currentRepo) return;

    try {
      await gitApi.add(currentRepo.id, files);
      await loadStatus();
      notify.success('Files staged');
    } catch (error) {
      notify.error(`Failed to stage files: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadStatus]);

  const unstageFiles = useCallback(async (files) => {
    if (!currentRepo) return;

    try {
      await gitApi.reset(currentRepo.id, files);
      await loadStatus();
      notify.success('Files unstaged');
    } catch (error) {
      notify.error(`Failed to unstage files: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadStatus]);

  const stageAll = useCallback(async () => {
    await stageFiles(['.']);
  }, [stageFiles]);

  const unstageAll = useCallback(async () => {
    await unstageFiles(['.']);
  }, [unstageFiles]);

  return {
    status,
    loading: loading.status,
    loadStatus,
    stageFiles,
    unstageFiles,
    stageAll,
    unstageAll
  };
}

/**
 * Hook for git commit operations
 */
export function useGitCommit() {
  const { currentRepo } = useAppStore();
  const { loadStatus } = useGitStatus();
  const { loadLog } = useGitLog();

  const commit = useCallback(async (message) => {
    if (!currentRepo) return;

    try {
      await gitApi.commit(currentRepo.id, message);
      await loadStatus();
      await loadLog();
      notify.success('Commit successful');
    } catch (error) {
      notify.error(`Failed to commit: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadStatus, loadLog]);

  return { commit };
}

/**
 * Hook for git push/pull/fetch operations
 */
export function useGitRemote() {
  const { currentRepo } = useAppStore();
  const { loadStatus } = useGitStatus();
  const { loadLog } = useGitLog();

  const push = useCallback(async (branch, setUpstream = false) => {
    if (!currentRepo) return;

    try {
      await gitApi.push(currentRepo.id, 'origin', branch, setUpstream);
      await loadLog();
      notify.success('Push successful');
    } catch (error) {
      notify.error(`Failed to push: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadLog]);

  const pull = useCallback(async (branch) => {
    if (!currentRepo) return;

    try {
      await gitApi.pull(currentRepo.id, 'origin', branch);
      await loadStatus();
      await loadLog();
      notify.success('Pull successful');
    } catch (error) {
      notify.error(`Failed to pull: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadStatus, loadLog]);

  const fetch = useCallback(async () => {
    if (!currentRepo) return;

    try {
      await gitApi.fetch(currentRepo.id, 'origin');
      notify.success('Fetch successful');
    } catch (error) {
      notify.error(`Failed to fetch: ${error.message}`);
      throw error;
    }
  }, [currentRepo]);

  return { push, pull, fetch };
}

/**
 * Hook for branch operations
 */
export function useGitBranch() {
  const {
    currentRepo,
    branches,
    setBranches,
    loading,
    setLoading
  } = useAppStore();
  const { loadStatus } = useGitStatus();

  const loadBranches = useCallback(async () => {
    if (!currentRepo) return;

    setLoading('branches', true);
    try {
      const result = await gitApi.getBranches(currentRepo.id);
      setBranches(result.branches);
    } catch (error) {
      notify.error(`Failed to get branches: ${error.message}`);
    } finally {
      setLoading('branches', false);
    }
  }, [currentRepo?.id, setBranches, setLoading]);

  const createBranch = useCallback(async (name, startPoint) => {
    if (!currentRepo) return;

    try {
      await gitApi.createBranch(currentRepo.id, name, startPoint);
      await loadBranches();
      await loadStatus();
      notify.success(`Branch '${name}' created`);
    } catch (error) {
      notify.error(`Failed to create branch: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadBranches, loadStatus]);

  const deleteBranch = useCallback(async (name, force = false) => {
    if (!currentRepo) return;

    try {
      await gitApi.deleteBranch(currentRepo.id, name, force);
      await loadBranches();
      notify.success(`Branch '${name}' deleted`);
    } catch (error) {
      notify.error(`Failed to delete branch: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadBranches]);

  const checkout = useCallback(async (branch) => {
    if (!currentRepo) return;

    try {
      await gitApi.checkout(currentRepo.id, branch);
      await loadBranches();
      await loadStatus();
      notify.success(`Switched to branch '${branch}'`);
    } catch (error) {
      notify.error(`Failed to checkout: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadBranches, loadStatus]);

  const renameBranch = useCallback(async (oldName, newName) => {
    if (!currentRepo) return;

    try {
      await gitApi.renameBranch(currentRepo.id, oldName, newName);
      await loadBranches();
      notify.success(`Branch renamed to '${newName}'`);
    } catch (error) {
      notify.error(`Failed to rename branch: ${error.message}`);
      throw error;
    }
  }, [currentRepo, loadBranches]);

  return {
    branches,
    loading: loading.branches,
    loadBranches,
    createBranch,
    deleteBranch,
    checkout,
    renameBranch
  };
}

/**
 * Hook for commit history
 */
export function useGitLog() {
  const {
    currentRepo,
    commits,
    setCommits,
    loading,
    setLoading
  } = useAppStore();

  const loadLog = useCallback(async (limit = 100) => {
    if (!currentRepo) return;

    setLoading('commits', true);
    try {
      const result = await gitApi.getLog(currentRepo.id, limit);
      setCommits(result.log.commits);
    } catch (error) {
      notify.error(`Failed to get commit history: ${error.message}`);
    } finally {
      setLoading('commits', false);
    }
  }, [currentRepo?.id, setCommits, setLoading]);

  return {
    commits,
    loading: loading.commits,
    loadLog
  };
}

/**
 * Hook for diff operations
 */
export function useGitDiff() {
  const { currentRepo } = useAppStore();

  const getDiff = useCallback(async (options = {}) => {
    if (!currentRepo) return null;

    try {
      const result = await gitApi.getDiff(currentRepo.id, options);
      return result.diff.diff;
    } catch (error) {
      notify.error(`Failed to get diff: ${error.message}`);
      return null;
    }
  }, [currentRepo]);

  const getDiffSummary = useCallback(async (cached = false) => {
    if (!currentRepo) return null;

    try {
      const result = await gitApi.getDiffSummary(currentRepo.id, cached);
      return result.summary;
    } catch (error) {
      notify.error(`Failed to get diff summary: ${error.message}`);
      return null;
    }
  }, [currentRepo]);

  return { getDiff, getDiffSummary };
}
