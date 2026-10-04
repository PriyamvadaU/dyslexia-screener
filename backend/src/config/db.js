import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurable persistent data directory for Render Persistent Disks / Docker / Local dev
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : (process.env.RENDER_DISK_PATH
      ? path.resolve(process.env.RENDER_DISK_PATH)
      : path.resolve(__dirname, '../../data'));

const DB_FILE = process.env.DB_FILE_PATH
  ? path.resolve(process.env.DB_FILE_PATH)
  : path.join(DATA_DIR, 'screener_db.json');

const INITIAL_SCHEMA = {
  users: [],
  children: [],
  consentRecords: [],
  learnSessions: [],
  testSessions: [],
  scores: [],
  writingSessions: [], // Phase 2 extension
  lessonProgress: [], // Persistent lesson progress for UKG–Grade 3
  scoringConfigOverrides: null
};

class LocalDatabase {
  constructor() {
    this.data = { ...INITIAL_SCHEMA };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...INITIAL_SCHEMA, ...JSON.parse(raw) };
      } else {
        this.save();
      }

      // Bootstrap initial user if specified via environment configuration (e.g. Render Dashboard)
      this.checkInitialAdminBootstrap();
    } catch (err) {
      console.error('[DB] Failed to load DB file, initializing with fresh schema:', err);
      this.data = { ...INITIAL_SCHEMA };
      this.save();
    }
  }

  checkInitialAdminBootstrap() {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const adminName = process.env.INITIAL_ADMIN_NAME || process.env.ADMIN_NAME || 'Administrator';
    const adminRole = process.env.INITIAL_ADMIN_ROLE || 'parent';

    if (adminEmail && adminPassword) {
      const normalizedEmail = adminEmail.toLowerCase().trim();
      const existing = this.findOne('users', u => u.email === normalizedEmail);
      if (!existing) {
        try {
          const salt = bcrypt.genSaltSync(10);
          const passwordHash = bcrypt.hashSync(adminPassword, salt);
          const newUser = {
            id: uuidv4(),
            name: adminName.trim(),
            email: normalizedEmail,
            passwordHash,
            role: adminRole,
            createdAt: new Date().toISOString()
          };
          this.insert('users', newUser);
          console.log(`[DB] Initial admin user provisioned via environment configuration: ${normalizedEmail}`);
        } catch (err) {
          console.error('[DB] Error creating initial admin user:', err);
        }
      }
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error writing to DB file:', err);
    }
  }

  // Generic collection helpers
  find(collectionName, predicate) {
    const list = this.data[collectionName] || [];
    if (!predicate) return [...list];
    return list.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const list = this.data[collectionName] || [];
    return list.find(predicate) || null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, item => item.id === id);
  }

  insert(collectionName, item) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    const record = {
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };
    this.data[collectionName].push(record);
    this.save();
    return record;
  }

  update(collectionName, id, updates) {
    const list = this.data[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;
    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.save();
    return updated;
  }

  delete(collectionName, id) {
    const list = this.data[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.save();
    return true;
  }

  // Scoring config custom override helpers
  getConfigOverrides() {
    return this.data.scoringConfigOverrides;
  }

  setConfigOverrides(newConfig) {
    this.data.scoringConfigOverrides = newConfig;
    this.save();
    return this.data.scoringConfigOverrides;
  }
}

export const db = new LocalDatabase();
