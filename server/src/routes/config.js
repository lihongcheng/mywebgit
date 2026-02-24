import express from 'express';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_DIR = join(__dirname, '../../data');
const SETTINGS_FILE = join(CONFIG_DIR, 'settings.json');

const router = express.Router();

/**
 * GET /api/config - Get application settings
 */
router.get('/', async (req, res) => {
  try {
    const exists = await fs.pathExists(SETTINGS_FILE);
    if (!exists) {
      return res.json({
        success: true,
        settings: {
          theme: 'light',
          editor: 'vscode',
          confirmActions: true
        }
      });
    }

    const settings = await fs.readJson(SETTINGS_FILE);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/config - Update application settings
 */
router.put('/', async (req, res) => {
  try {
    await fs.ensureDir(CONFIG_DIR);

    let existing = {};
    const exists = await fs.pathExists(SETTINGS_FILE);
    if (exists) {
      existing = await fs.readJson(SETTINGS_FILE);
    }

    const settings = { ...existing, ...req.body };
    await fs.writeJson(SETTINGS_FILE, settings, { spaces: 2 });

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
