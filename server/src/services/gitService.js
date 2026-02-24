import simpleGit from 'simple-git';

/**
 * Git Service - Wrapper for simple-git operations
 */
class GitService {
  constructor(repoPath) {
    this.git = simpleGit(repoPath, {
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: true
    });
    this.repoPath = repoPath;
  }

  /**
   * Get repository status
   */
  async getStatus() {
    try {
      const status = await this.git.status();
      return {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        conflicted: status.conflicted,
        renamed: status.renamed,
        files: status.files.map(f => ({
          path: f.path,
          index: f.index,
          working_dir: f.working_dir
        }))
      };
    } catch (error) {
      // Check if it's a lock file error
      if (error.message && error.message.includes('index.lock')) {
        throw new Error('Git index is locked. Please delete .git/index.lock file and try again.');
      }
      throw error;
    }
  }

  /**
   * Stage files
   */
  async add(files) {
    if (files && files.length > 0) {
      await this.git.add(files);
    } else {
      await this.git.add('.');
    }
    return { success: true };
  }

  /**
   * Unstage files
   */
  async reset(files) {
    if (files && files.length > 0) {
      await this.git.reset(['HEAD', '--', ...files]);
    } else {
      await this.git.reset(['HEAD']);
    }
    return { success: true };
  }

  /**
   * Commit changes
   */
  async commit(message) {
    const result = await this.git.commit(message);
    return {
      success: true,
      commit: result.commit,
      branch: result.branch,
      summary: result.summary
    };
  }

  /**
   * Push to remote
   */
  async push(remote = 'origin', branch, options = {}) {
    const pushOptions = {
      '--set-upstream': options.setUpstream ? null : undefined
    };
    const result = await this.git.push(remote, branch, pushOptions);
    return {
      success: true,
      pushed: result.pushed,
      branch: result.branch,
      remote: result.remote
    };
  }

  /**
   * Pull from remote
   */
  async pull(remote = 'origin', branch) {
    const result = await this.git.pull(remote, branch);
    return {
      success: true,
      files: result.files,
      summary: result.summary,
      created: result.created,
      deleted: result.deleted
    };
  }

  /**
   * Fetch from remote
   */
  async fetch(remote = 'origin') {
    await this.git.fetch(remote);
    return { success: true };
  }

  /**
   * Prune stale remote-tracking branches
   */
  async prune(remote = 'origin') {
    await this.git.remote(['prune', remote]);
    return { success: true };
  }

  /**
   * Get stale local branches (local branches that don't exist on remote)
   * Simple approach: compare local branch names with remote branch names
   */
  async getStaleBranches(remote = 'origin') {
    try {
      // First fetch and prune to get latest remote refs
      await this.git.fetch([remote, '--prune']);

      // Get all local branches
      const localBranches = await this.git.branchLocal();

      // Get all remote branches
      const remoteBranches = await this.git.branch(['-r']);

      // Extract remote branch names (remove 'origin/' prefix)
      const remoteBranchNames = new Set(
        remoteBranches.all
          .filter(name => name.startsWith(`${remote}/`))
          .map(name => name.replace(`${remote}/`, ''))
      );

      // Find local branches that don't exist on remote
      const staleBranches = [];
      const protectedBranches = ['main', 'master', 'develop', 'dev'];

      for (const branchName of localBranches.all) {
        // Skip current branch
        if (branchName === localBranches.current) continue;

        // Skip protected branches
        if (protectedBranches.includes(branchName.toLowerCase())) continue;

        // Check if this branch exists on remote
        if (!remoteBranchNames.has(branchName)) {
          staleBranches.push({
            name: branchName,
            remoteExists: false
          });
        }
      }

      return { staleBranches, currentBranch: localBranches.current };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete multiple local branches
   */
  async deleteBranches(branchNames, force = false) {
    const results = [];
    for (const name of branchNames) {
      try {
        await this.git.deleteLocalBranch(name, force);
        results.push({ name, success: true });
      } catch (error) {
        results.push({ name, success: false, error: error.message });
      }
    }
    return { results };
  }

  /**
   * Get all branches
   */
  async getBranches() {
    const [local, remote] = await Promise.all([
      this.git.branchLocal(),
      this.git.branch(['-r'])
    ]);

    return {
      current: local.current,
      local: local.all.map(name => ({
        name,
        current: name === local.current
      })),
      remote: remote.all.map(name => ({
        name,
        remote: name
      }))
    };
  }

  /**
   * Create a new branch
   */
  async createBranch(name, startPoint) {
    if (startPoint) {
      await this.git.checkoutBranch(name, startPoint);
    } else {
      await this.git.checkoutLocalBranch(name);
    }
    return { success: true, branch: name };
  }

  /**
   * Switch branch
   */
  async checkout(branch) {
    try {
      await this.git.checkout(branch);
      return { success: true, branch };
    } catch (error) {
      // Check if it's a lock file error
      if (error.message && error.message.includes('index.lock')) {
        throw new Error('Git index is locked. Please delete .git/index.lock file and try again.');
      }
      throw error;
    }
  }

  /**
   * Checkout remote branch as new local branch with tracking
   */
  async checkoutRemote(remoteBranch, localBranch) {
    try {
      // checkoutBranch creates a new local branch tracking the remote branch
      await this.git.checkoutBranch(localBranch, remoteBranch);
      return { success: true, localBranch, remoteBranch };
    } catch (error) {
      if (error.message && error.message.includes('index.lock')) {
        throw new Error('Git index is locked. Please delete .git/index.lock file and try again.');
      }
      throw error;
    }
  }

  /**
   * Delete branch
   */
  async deleteBranch(name, force = false) {
    const options = force ? ['-D'] : ['-d'];
    await this.git.deleteLocalBranch(name, force);
    return { success: true };
  }

  /**
   * Rename branch
   */
  async renameBranch(oldName, newName) {
    await this.git.branch(['-m', oldName, newName]);
    return { success: true };
  }

  /**
   * Get commit log
   */
  async getLog(options = {}) {
    try {
      const log = await this.git.log({
        maxCount: options.maxCount || 100
      });

      return {
        commits: log.all.map(commit => ({
          hash: commit.hash || '',
          shortHash: commit.hash ? commit.hash.substring(0, 7) : '',
          message: commit.message || '',
          author: commit.author_name || commit.author || 'Unknown',
          email: commit.author_email || '',
          date: commit.date || new Date().toISOString(),
          refs: commit.refs || []
        })),
        total: log.total
      };
    } catch (error) {
      console.error('Error getting git log:', error);
      return {
        commits: [],
        total: 0
      };
    }
  }

  /**
   * Get diff
   */
  async getDiff(options = {}) {
    let diff;

    if (options.cached) {
      diff = await this.git.diff(['--cached']);
    } else if (options.file) {
      diff = await this.git.diff([options.file]);
    } else if (options.commit1 && options.commit2) {
      diff = await this.git.diff([options.commit1, options.commit2]);
    } else {
      diff = await this.git.diff();
    }

    return { diff };
  }

  /**
   * Get file diff with details
   */
  async getDiffSummary(options = {}) {
    const summary = await this.git.diffSummary(options.cached ? ['--cached'] : []);
    return {
      files: summary.files.map(f => ({
        file: f.file,
        changes: f.changes,
        insertions: f.insertions,
        deletions: f.deletions,
        binary: f.binary
      })),
      changed: summary.changed,
      insertions: summary.insertions,
      deletions: summary.deletions
    };
  }

  /**
   * Merge branch
   */
  async merge(branch, options = {}) {
    try {
      const mergeOptions = [];
      if (options.noFF) mergeOptions.push('--no-ff');
      if (options.squash) mergeOptions.push('--squash');

      const result = await this.git.merge([branch, ...mergeOptions]);
      return {
        success: true,
        result
      };
    } catch (error) {
      if (error.message.includes('CONFLICT')) {
        return {
          success: false,
          conflict: true,
          message: error.message
        };
      }
      throw error;
    }
  }

  /**
   * Rebase
   */
  async rebase(branch, options = {}) {
    try {
      const result = await this.git.rebase([branch]);
      return { success: true, result };
    } catch (error) {
      if (error.message.includes('CONFLICT')) {
        return {
          success: false,
          conflict: true,
          message: error.message
        };
      }
      throw error;
    }
  }

  /**
   * Abort rebase
   */
  async rebaseAbort() {
    await this.git.rebase(['--abort']);
    return { success: true };
  }

  /**
   * Continue rebase
   */
  async rebaseContinue() {
    await this.git.rebase(['--continue']);
    return { success: true };
  }

  /**
   * Stash changes
   */
  async stash(options = {}) {
    if (options.pop) {
      await this.git.stash(['pop', options.index || 0]);
    } else if (options.apply) {
      await this.git.stash(['apply', options.index || 0]);
    } else if (options.drop) {
      await this.git.stash(['drop', options.index || 0]);
    } else {
      await this.git.stash(options.message ? ['-m', options.message] : []);
    }
    return { success: true };
  }

  /**
   * Get stash list
   */
  async getStashList() {
    const result = await this.git.stashList();
    return {
      stashes: result.all.map(s => ({
        index: s.index || 0,
        message: s.message,
        hash: s.hash,
        date: s.date
      }))
    };
  }

  /**
   * Create tag
   */
  async createTag(name, message, commit) {
    if (message) {
      // Annotated tag
      const args = ['-a', name, '-m', message];
      if (commit) args.push(commit);
      await this.git.tag(args);
    } else {
      // Lightweight tag
      if (commit) {
        await this.git.tag([name, commit]);
      } else {
        await this.git.addTag(name);
      }
    }
    return { success: true, tag: name };
  }

  /**
   * Delete tag
   */
  async deleteTag(name) {
    await this.git.tag(['-d', name]);
    return { success: true };
  }

  /**
   * Get tags
   */
  async getTags() {
    const tags = await this.git.tags();
    return {
      tags: tags.all.map(name => ({ name })),
      latest: tags.latest
    };
  }

  /**
   * Reset
   */
  async resetTo(commit, mode = 'soft') {
    const modes = {
      soft: ['--soft'],
      mixed: ['--mixed'],
      hard: ['--hard']
    };
    await this.git.reset([...modes[mode], commit]);
    return { success: true };
  }

  /**
   * Revert commit
   */
  async revert(commit, noCommit = false) {
    const options = noCommit ? ['-n'] : [];
    await this.git.revert(commit, options);
    return { success: true };
  }

  /**
   * Get remote info
   */
  async getRemotes() {
    const remotes = await this.git.getRemotes(true);
    return {
      remotes: remotes.map(r => ({
        name: r.name,
        refs: r.refs
      }))
    };
  }

  /**
   * Check if path is a valid git repository
   */
  static async isValidRepo(path) {
    try {
      if (!path || typeof path !== 'string') {
        return false;
      }
      const git = simpleGit(path, {
        binary: 'git',
        maxConcurrentProcesses: 1,
        errors: function(error, method) {
          // Suppress error output for validation
          return;
        }
      });

      // Try a simple command that doesn't require index
      await git.revparse(['--git-dir']);
      return true;
    } catch (error) {
      // Don't log validation failures - they're expected
      return false;
    }
  }

  /**
   * Clone repository
   */
  static async clone(url, targetPath, options = {}) {
    const git = simpleGit();
    await git.clone(url, targetPath, options);
    return { success: true, path: targetPath };
  }

  /**
   * Initialize new repository
   */
  static async init(path) {
    const git = simpleGit(path);
    await git.init();
    return { success: true, path };
  }
}

export default GitService;
