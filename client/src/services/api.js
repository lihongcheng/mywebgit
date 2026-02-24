import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error || error.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// Repository APIs
export const repoApi = {
  getAll: () => api.get('/repos'),
  getById: (id) => api.get(`/repos/${id}`),
  add: (path, name) => api.post('/repos', { path, name }),
  remove: (id) => api.delete(`/repos/${id}`),
  update: (id, data) => api.put(`/repos/${id}`, data),
  clone: (url, path, name) => api.post('/repos/clone', { url, path, name }),
  getStatus: (id) => api.get(`/repos/${id}/status`),
  getBranches: (id) => api.get(`/repos/${id}/branches`),
  getLog: (id, limit = 100) => api.get(`/repos/${id}/log?limit=${limit}`)
};

// Git operation APIs
export const gitApi = {
  // Status
  getStatus: (repoId) => api.get('/git/status', { params: { repoId } }),

  // Stage/Unstage
  add: (repoId, files) => api.post('/git/add', { repoId, files }),
  reset: (repoId, files) => api.post('/git/reset', { repoId, files }),

  // Commit
  commit: (repoId, message) => api.post('/git/commit', { repoId, message }),

  // Push/Pull/Fetch
  push: (repoId, remote, branch, setUpstream) =>
    api.post('/git/push', { repoId, remote, branch, setUpstream }),
  pull: (repoId, remote, branch) =>
    api.post('/git/pull', { repoId, remote, branch }),
  fetch: (repoId, remote) =>
    api.post('/git/fetch', { repoId, remote }),
  prune: (repoId, remote) =>
    api.post('/git/prune', { repoId, remote }),
  getStaleBranches: (repoId, remote) =>
    api.get('/git/stale-branches', { params: { repoId, remote } }),
  deleteBranches: (repoId, branches, force) =>
    api.post('/git/delete-branches', { repoId, branches, force }),

  // Branches
  getBranches: (repoId) => api.get('/git/branches', { params: { repoId } }),
  createBranch: (repoId, name, startPoint) =>
    api.post('/git/branch', { repoId, name, startPoint }),
  deleteBranch: (repoId, name, force) =>
    api.delete('/git/branch', { data: { repoId, name, force } }),
  checkout: (repoId, branch) =>
    api.post('/git/checkout', { repoId, branch }),
  renameBranch: (repoId, oldName, newName) =>
    api.post('/git/rename-branch', { repoId, oldName, newName }),

  // Log & Diff
  getLog: (repoId, limit = 100) =>
    api.get('/git/log', { params: { repoId, limit } }),
  getDiff: (repoId, options = {}) =>
    api.get('/git/diff', { params: { repoId, ...options } }),
  getDiffSummary: (repoId, cached = false) =>
    api.get('/git/diff-summary', { params: { repoId, cached } }),

  // Merge & Rebase
  merge: (repoId, branch, options = {}) =>
    api.post('/git/merge', { repoId, branch, ...options }),
  rebase: (repoId, branch) =>
    api.post('/git/rebase', { repoId, branch }),
  rebaseAbort: (repoId) =>
    api.post('/git/rebase/abort', { repoId }),
  rebaseContinue: (repoId) =>
    api.post('/git/rebase/continue', { repoId }),

  // Stash
  stash: (repoId, options = {}) =>
    api.post('/git/stash', { repoId, ...options }),
  getStashList: (repoId) =>
    api.get('/git/stash/list', { params: { repoId } }),

  // Tags
  createTag: (repoId, name, message, commit) =>
    api.post('/git/tag', { repoId, name, message, commit }),
  deleteTag: (repoId, name) =>
    api.delete('/git/tag', { data: { repoId, name } }),
  getTags: (repoId) =>
    api.get('/git/tags', { params: { repoId } }),

  // Reset & Revert
  reset: (repoId, commit, mode) =>
    api.post('/git/reset', { repoId, commit, mode }),
  revert: (repoId, commit, noCommit) =>
    api.post('/git/revert', { repoId, commit, noCommit }),

  // Remotes
  getRemotes: (repoId) =>
    api.get('/git/remotes', { params: { repoId } })
};

// Config APIs
export const configApi = {
  get: () => api.get('/config'),
  update: (settings) => api.put('/config', settings)
};

export default api;
