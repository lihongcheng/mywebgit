import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import GitService from './gitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_FILE = join(__dirname, '../../data/repos.json');

/**
 * Repository Service - Manages repository configurations
 */
class RepoService {
  constructor() {
    this.repos = [];
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize service and load repos from config
   */
  async init() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  async _doInit() {
    try {
      await fs.ensureDir(join(__dirname, '../../data'));
      const exists = await fs.pathExists(CONFIG_FILE);

      if (exists) {
        const data = await fs.readJson(CONFIG_FILE);
        this.repos = data.repos || [];
      } else {
        this.repos = [];
        await this.save();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize repo service:', error);
      this.repos = [];
      this.initialized = true;
    }
  }

  /**
   * Save repos to config file
   */
  async save() {
    try {
      await fs.writeJson(CONFIG_FILE, { repos: this.repos }, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save repos:', error);
      throw error;
    }
  }

  /**
   * Get all repositories
   */
  async getAll() {
    await this.init();

    // Validate each repo still exists and is valid
    const validRepos = [];
    for (const repo of this.repos) {
      try {
        const isValid = await GitService.isValidRepo(repo.path);
        validRepos.push({
          ...repo,
          valid: isValid
        });
      } catch (error) {
        console.error(`Error checking repo ${repo.path}:`, error.message);
        // Still include the repo but mark as invalid
        validRepos.push({
          ...repo,
          valid: false
        });
      }
    }

    return validRepos;
  }

  /**
   * Get repository by ID
   */
  async getById(id) {
    await this.init();
    return this.repos.find(r => r.id === id);
  }

  /**
   * Add a new repository
   */
  async add(path, name) {
    await this.init();

    // Normalize path
    const normalizedPath = path.trim();

    // Check if path is valid git repo
    const isValid = await GitService.isValidRepo(normalizedPath);
    if (!isValid) {
      throw new Error('Not a valid git repository');
    }

    // Check if already added
    const exists = this.repos.find(r => r.path === normalizedPath);
    if (exists) {
      throw new Error('Repository already added');
    }

    const repo = {
      id: uuidv4(),
      path: normalizedPath,
      name: name || normalizedPath.split('/').pop(),
      addedAt: new Date().toISOString()
    };

    this.repos.push(repo);
    await this.save();

    return repo;
  }

  /**
   * Remove repository from list
   */
  async remove(id) {
    await this.init();

    const index = this.repos.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Repository not found');
    }

    this.repos.splice(index, 1);
    await this.save();

    return { success: true };
  }

  /**
   * Update repository info
   */
  async update(id, updates) {
    await this.init();

    const repo = this.repos.find(r => r.id === id);
    if (!repo) {
      throw new Error('Repository not found');
    }

    if (updates.name) repo.name = updates.name;
    if (updates.path) {
      const isValid = await GitService.isValidRepo(updates.path);
      if (!isValid) {
        throw new Error('Not a valid git repository');
      }
      repo.path = updates.path;
    }

    await this.save();
    return repo;
  }

  /**
   * Clone a repository
   */
  async clone(url, targetPath, name) {
    await this.init();

    await GitService.clone(url, targetPath);

    const repo = {
      id: uuidv4(),
      path: targetPath,
      name: name || targetPath.split('/').pop(),
      addedAt: new Date().toISOString(),
      cloneUrl: url
    };

    this.repos.push(repo);
    await this.save();

    return repo;
  }

  /**
   * Get GitService instance for a repository
   */
  getGitService(repoPath) {
    return new GitService(repoPath);
  }
}

export default new RepoService();
