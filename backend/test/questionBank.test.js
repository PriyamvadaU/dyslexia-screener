import test from 'node:test';
import assert from 'node:assert';
import { db } from '../src/config/db.js';
import { seedQuestionBank } from '../src/data/seedQuestions.js';
import { sampleAssessmentQuestions } from '../src/data/questionBank.js';

test('Dyslexia Question Bank - Seeding & Completeness', () => {
  const res = seedQuestionBank();
  assert.strictEqual(res.success, true);
  assert.strictEqual(db.data.questions.length, 690);

  // Verify counts per grade
  assert.strictEqual(res.byGrade['UKG'], 110);
  assert.strictEqual(res.byGrade['1'], 170);
  assert.strictEqual(res.byGrade['2'], 225);
  assert.strictEqual(res.byGrade['3'], 185);
});

test('Dyslexia Question Bank - Strict Grade Isolation', () => {
  const grades = ['UKG', '1', '2', '3'];

  grades.forEach(g => {
    const list = db.data.questions.filter(q => q.grade === g);
    assert(list.length > 0, `Grade ${g} must have questions`);

    list.forEach(q => {
      assert.strictEqual(q.grade, g, `Question ${q.id} in grade ${g} has mismatched grade ${q.grade}`);
      if (g === 'UKG') {
        assert(q.id.startsWith('UKG-'), `UKG question ${q.id} should have UKG prefix`);
        assert(!q.id.startsWith('G1-') && !q.id.startsWith('G2-') && !q.id.startsWith('G3-'), 'UKG must not have G1/G2/G3 IDs');
      } else if (g === '1') {
        assert(q.id.startsWith('G1-'), `Grade 1 question ${q.id} should have G1 prefix`);
      } else if (g === '2') {
        assert(q.id.startsWith('G2-'), `Grade 2 question ${q.id} should have G2 prefix`);
      } else if (g === '3') {
        assert(q.id.startsWith('G3-'), `Grade 3 question ${q.id} should have G3 prefix`);
      }
    });
  });

  // Verify sampleAssessmentQuestions adheres to strict grade isolation
  const ukgSample = sampleAssessmentQuestions({ grade: 'UKG', targetCount: 10 });
  ukgSample.forEach(q => {
    assert.strictEqual(q.standard_min, 'UKG', `UKG sample returned question from ${q.standard_min}`);
  });
});

test('Dyslexia Question Bank - MCQ Answer & Option Validation', () => {
  const mcqs = db.data.questions.filter(q => q.question_type !== 'Oral response');
  assert.strictEqual(mcqs.length, 605);

  mcqs.forEach(q => {
    assert(Array.isArray(q.options), `Question ${q.id} options must be an array`);
    assert(q.options.length >= 2, `Question ${q.id} must have at least 2 options, found ${q.options.length}`);
    
    const correctOptions = q.options.filter(o => o.isCorrect === true);
    assert.strictEqual(correctOptions.length, 1, `Question ${q.id} must have exactly 1 correct option, found ${correctOptions.length}`);
    assert(q.correct_answer, `Question ${q.id} must specify correct_answer`);
    assert(q.audio_script && q.audio_script.length > 0, `Question ${q.id} must have an audio_script`);
  });
});

test('Dyslexia Question Bank - Oral Response Validation', () => {
  const orals = db.data.questions.filter(q => q.question_type === 'Oral response');
  assert.strictEqual(orals.length, 85);

  orals.forEach(q => {
    assert(q.expected_oral_response && q.expected_oral_response.trim().length > 0, `Oral question ${q.id} must specify expected_oral_response`);
    assert(q.audio_script && q.audio_script.trim().length > 0, `Oral question ${q.id} must have audio_script`);
    assert(q.scoring_information, `Oral question ${q.id} must have scoring_information`);
  });
});

test('Dyslexia Question Bank - No Writing Requirement', () => {
  // Verify no questions contain instructions requiring child handwriting or typing
  db.data.questions.forEach(q => {
    const fullText = `${q.question} ${q.stimulus} ${q.explanation}`.toLowerCase();
    assert(!fullText.includes('write your answer'), `Question ${q.id} must not require child to write`);
    assert(!fullText.includes('handwrite'), `Question ${q.id} must not require handwriting`);
    assert(!fullText.includes('fill in the blank by typing'), `Question ${q.id} must not require typing`);
  });
});
