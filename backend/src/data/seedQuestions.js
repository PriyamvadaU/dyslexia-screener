import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANK_FILE = path.join(__dirname, 'dyslexiaQuestionBank.json');

export function seedQuestionBank() {
  if (!fs.existsSync(BANK_FILE)) {
    console.error(`[Seed] Error: Question bank file not found at ${BANK_FILE}`);
    return { success: false, count: 0 };
  }

  const raw = fs.readFileSync(BANK_FILE, 'utf-8');
  const questions = JSON.parse(raw);

  // Initialize questions table in db if not present
  if (!Array.isArray(db.data.questions)) {
    db.data.questions = [];
  }
  if (!Array.isArray(db.data.questionProgress)) {
    db.data.questionProgress = [];
  }

  const existingMap = new Map();
  db.data.questions.forEach(q => existingMap.set(q.id, q));

  let insertedCount = 0;
  let updatedCount = 0;

  questions.forEach(q => {
    if (existingMap.has(q.id)) {
      // Update existing
      const idx = db.data.questions.findIndex(item => item.id === q.id);
      db.data.questions[idx] = { ...db.data.questions[idx], ...q };
      updatedCount++;
    } else {
      // Insert new
      db.data.questions.push({
        ...q,
        createdAt: new Date().toISOString()
      });
      existingMap.set(q.id, q);
      insertedCount++;
    }
  });

  db.save();

  // Statistics
  const byGrade = {};
  const byDomain = {};
  const byType = {};

  db.data.questions.forEach(q => {
    const g = q.grade || 'Unknown';
    const d = q.domain || 'General';
    const t = q.question_type || 'MCQ';

    byGrade[g] = (byGrade[g] || 0) + 1;
    byDomain[d] = (byDomain[d] || 0) + 1;
    byType[t] = (byType[t] || 0) + 1;
  });

  console.log('====================================================');
  console.log('   DYSLEXIA NON-WRITING QUESTION BANK SEED REPORT   ');
  console.log('====================================================');
  console.log(`Total Questions in Database: ${db.data.questions.length}`);
  console.log(`New Inserted: ${insertedCount} | Updated: ${updatedCount}`);
  console.log('\n--- Counts by Grade ---');
  Object.keys(byGrade).sort().forEach(g => {
    const label = g === 'UKG' ? 'UKG (Ages 5–6)' : `Grade ${g}`;
    console.log(`  ${label}: ${byGrade[g]} questions`);
  });
  console.log('\n--- Counts by Domain ---');
  Object.keys(byDomain).sort().forEach(d => {
    console.log(`  ${d}: ${byDomain[d]} questions`);
  });
  console.log('\n--- Counts by Question Type ---');
  Object.keys(byType).sort().forEach(t => {
    console.log(`  ${t}: ${byType[t]} questions`);
  });
  console.log('====================================================\n');

  return {
    success: true,
    totalCount: db.data.questions.length,
    insertedCount,
    updatedCount,
    byGrade,
    byDomain,
    byType
  };
}

// Auto-run when executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seedQuestions.js')) {
  seedQuestionBank();
}
