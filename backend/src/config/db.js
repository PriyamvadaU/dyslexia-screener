import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'screener_db.json');

const INITIAL_SCHEMA = {
  users: [],
  children: [],
  consentRecords: [],
  learnSessions: [],
  testSessions: [],
  scores: [],
  writingSessions: [], // Phase 2 extension
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
    } catch (err) {
      console.error('[DB] Failed to load DB file, initializing with fresh schema:', err);
      this.data = { ...INITIAL_SCHEMA };
      this.save();
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
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
