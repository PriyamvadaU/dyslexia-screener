// backend/scripts/parseQuestionBank.js
// Parses the uploaded DOCX question bank and writes a JSON file for seeding.

import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';

// Absolute path to the user‑uploaded DOCX (do not move)
const DOCX_PATH = path.resolve(
  'C:/Users/pihuu/.gemini/antigravity/brain/83d8792e-fb69-46ff-8f26-012b8c1714fa/.user_uploaded/media_1791118029970.docx'
);

// Output JSON (git‑ignored)
const OUTPUT_JSON = path.resolve('backend/data/questionBank.json');

const GRADE_HEADERS = ['UKG', 'Grade 1', 'Grade 2', 'Grade 3'];

async function main() {
  if (!fs.existsSync(DOCX_PATH)) {
    console.error('DOCX not found:', DOCX_PATH);
    process.exit(1);
  }
  const { value: rawText } = await mammoth.extractRawText({ path: DOCX_PATH });
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l);

  const questions = [];
  let currentGrade = null;
  let currentDomain = null;

  for (const line of lines) {
    // Grade heading detection
    const gradeMatch = GRADE_HEADERS.find(g => line.startsWith(g));
    if (gradeMatch) {
      currentGrade = gradeMatch;
      currentDomain = null;
      continue;
    }
    // Very naive domain detection – capitalised line without a period
    if (!/^\d+\./.test(line) && /^[A-Z][A-Za-z &]+$/.test(line) && !line.endsWith('.')) {
      currentDomain = line;
      continue;
    }
    // Anything else is treated as a question if context exists
    if (currentGrade && currentDomain) {
      questions.push({
        id: uuidv4(),
        grade: currentGrade,
        domain: currentDomain,
        type: 'mcq',
        prompt: line,
        options: [],
        correctOptionId: null,
        difficulty: 'easy',
        explanation: ''
      });
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_JSON);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(questions, null, 2), 'utf-8');
  console.log(`✅ Parsed ${questions.length} questions → ${OUTPUT_JSON}`);
}

main().catch(err => {
  console.error('Parsing error:', err);
  process.exit(1);
});
