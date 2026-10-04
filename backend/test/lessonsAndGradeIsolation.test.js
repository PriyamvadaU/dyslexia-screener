import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { authRouter } from '../src/routes/authRoutes.js';
import { childRouter } from '../src/routes/childRoutes.js';
import { sessionRouter } from '../src/routes/sessionRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/children', childRouter);
app.use('/api/sessions', sessionRouter);

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Grade Isolation & Lesson Progress Suite', async () => {
  // 1. Register test user
  const email = `parent_isolation_${Date.now()}@test.com`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      email,
      password: 'StrongPassword123!',
      role: 'parent'
    })
  });
  assert.equal(regRes.status, 201);
  const { token } = await regRes.json();
  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2. Create UKG Child
  const ukgChildRes = await fetch(`${baseUrl}/children`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Little Aarav',
      age: 5,
      grade: 'UKG',
      consentConfirmed: true,
      signatureName: 'Priya Sharma'
    })
  });
  assert.equal(ukgChildRes.status, 201);
  const ukgChild = (await ukgChildRes.json()).child;
  assert.equal(ukgChild.grade, 'UKG');

  // 3. Create Grade 2 Child
  const g2ChildRes = await fetch(`${baseUrl}/children`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Older Rohan',
      age: 7,
      grade: '2',
      consentConfirmed: true,
      signatureName: 'Priya Sharma'
    })
  });
  assert.equal(g2ChildRes.status, 201);
  const g2Child = (await g2ChildRes.json()).child;
  assert.equal(g2Child.grade, '2');

  // 4. TEST GRADE ISOLATION: UKG Child MUST only get UKG questions
  const ukgQRes = await fetch(`${baseUrl}/sessions/questions?childId=${ukgChild.id}`, {
    headers: authHeader
  });
  assert.equal(ukgQRes.status, 200);
  const ukgQData = await ukgQRes.json();
  assert.equal(ukgQData.grade, 'UKG');
  assert.ok(ukgQData.questions.length > 0);
  ukgQData.questions.forEach(q => {
    assert.equal(q.standard_min || q.grade, 'UKG', `Expected UKG question, got ${q.id} with grade ${q.standard_min || q.grade}`);
  });

  // 5. TEST OVERRIDE PREVENTION: Even if query requests grade=3, child profile enforces UKG!
  const tamperRes = await fetch(`${baseUrl}/sessions/questions?childId=${ukgChild.id}&grade=3`, {
    headers: authHeader
  });
  assert.equal(tamperRes.status, 200);
  const tamperData = await tamperRes.json();
  assert.equal(tamperData.grade, 'UKG', 'Should enforce child profile grade over query grade param');
  tamperData.questions.forEach(q => {
    assert.equal(q.standard_min || q.grade, 'UKG');
  });

  // 6. TEST GRADE 2 ISOLATION: Grade 2 child gets only Grade 2 questions
  const g2QRes = await fetch(`${baseUrl}/sessions/questions?childId=${g2Child.id}`, {
    headers: authHeader
  });
  assert.equal(g2QRes.status, 200);
  const g2QData = await g2QRes.json();
  assert.equal(g2QData.grade, '2');
  g2QData.questions.forEach(q => {
    assert.equal(q.standard_min || q.grade, '2', `Expected Grade 2 question, got ${q.id} with grade ${q.standard_min || q.grade}`);
  });

  // 7. TEST LESSONS ROADMAP: UKG Child gets 22 bite-sized lessons
  const lessonsRes = await fetch(`${baseUrl}/sessions/lessons?childId=${ukgChild.id}`, {
    headers: authHeader
  });
  assert.equal(lessonsRes.status, 200);
  const lessonsData = await lessonsRes.json();
  assert.equal(lessonsData.grade, 'UKG');
  assert.equal(lessonsData.roadmap.totalLessons, 22);
  assert.ok(lessonsData.domains.length > 0);
  assert.ok(lessonsData.nextLesson);

  const firstLesson = lessonsData.domains[0].lessons[0];
  assert.ok(firstLesson.id);

  // 8. TEST LESSON QUESTIONS: Each lesson contains a small number (5) of questions
  const lessonQRes = await fetch(`${baseUrl}/sessions/lessons/${firstLesson.id}?childId=${ukgChild.id}`, {
    headers: authHeader
  });
  assert.equal(lessonQRes.status, 200);
  const lessonQData = await lessonQRes.json();
  assert.equal(lessonQData.questions.length, 5, 'Target 5 questions per lesson');
  lessonQData.questions.forEach(q => {
    assert.equal(q.standard_min || q.grade, 'UKG');
  });

  // 9. TEST CROSS-GRADE LESSON ACCESS REJECTION: UKG child attempting to access Grade 2 lesson must be blocked
  const g2LessonId = '2_morphology_l1';
  const blockedRes = await fetch(`${baseUrl}/sessions/lessons/${g2LessonId}?childId=${ukgChild.id}`, {
    headers: authHeader
  });
  assert.equal(blockedRes.status, 403, 'Cross-grade lesson access must be blocked with 403 Forbidden');

  // 10. TEST PROGRESS PERSISTENCE: Save progress idempotently
  const saveRes1 = await fetch(`${baseUrl}/sessions/lesson-progress`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      childId: ukgChild.id,
      lessonId: firstLesson.id,
      currentQuestionIdx: 2,
      answers: {
        [firstLesson.questionIds[0]]: { selected: 'opt_A', isCorrect: true },
        [firstLesson.questionIds[1]]: { selected: 'opt_B', isCorrect: true }
      },
      completed: false
    })
  });
  assert.equal(saveRes1.status, 200);

  // Moving backward to Question 1 does NOT create duplicate records
  const saveRes2 = await fetch(`${baseUrl}/sessions/lesson-progress`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      childId: ukgChild.id,
      lessonId: firstLesson.id,
      currentQuestionIdx: 0,
      answers: {
        [firstLesson.questionIds[0]]: { selected: 'opt_A', isCorrect: true },
        [firstLesson.questionIds[1]]: { selected: 'opt_B', isCorrect: true }
      },
      completed: false
    })
  });
  assert.equal(saveRes2.status, 200);

  // Verify resume state
  const resumeRes = await fetch(`${baseUrl}/sessions/lessons/${firstLesson.id}?childId=${ukgChild.id}`, {
    headers: authHeader
  });
  assert.equal(resumeRes.status, 200);
  const resumeData = await resumeRes.json();
  assert.ok(resumeData.savedState);
  assert.equal(resumeData.savedState.answers[firstLesson.questionIds[0]].isCorrect, true);
});
