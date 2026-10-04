import fs from 'fs';
import path from 'path';
import { DOCX_QUESTION_BANK } from '../src/data/docxQuestionBank.js';
import { QUESTION_BANK } from '../src/data/questionBank.js';

const outputPath = path.resolve('backend/src/data/lessonsData.js');

// Domain visual icons & descriptions
const DOMAIN_METAS = {
  'Rhyming': {
    id: 'rhyming',
    title: 'Rhyming Adventures',
    icon: 'Sparkles',
    emoji: '🌈',
    color: 'from-amber-400 to-rose-400',
    description: 'Find words that rhyme and share fun ending sounds.'
  },
  'Phonological awareness': {
    id: 'phonological_awareness',
    title: 'Beginning Sounds',
    icon: 'Volume2',
    emoji: '🔊',
    color: 'from-indigo-500 to-sky-400',
    description: 'Identify the very first sounds in spoken words.'
  },
  'Syllable awareness': {
    id: 'syllable_awareness',
    title: 'Syllables & Word Beats',
    icon: 'Music',
    emoji: '🎵',
    color: 'from-emerald-500 to-teal-400',
    description: 'Clap and count the musical beats in words.'
  },
  'Letter recognition': {
    id: 'letter_recognition',
    title: 'Letter & Sound Match',
    icon: 'BookOpen',
    emoji: '🔤',
    color: 'from-purple-500 to-indigo-400',
    description: 'Connect spoken phonemes with friendly letter shapes.'
  },
  'Oral/listening': {
    id: 'oral_listening',
    title: 'Listening & Attention',
    icon: 'Smile',
    emoji: '👂',
    color: 'from-rose-500 to-amber-400',
    description: 'Listen carefully and respond to oral directions.'
  },
  'Listening comprehension': {
    id: 'listening_comprehension',
    title: 'Story Adventures',
    icon: 'Compass',
    emoji: '📖',
    color: 'from-blue-500 to-emerald-400',
    description: 'Listen to short cheerful stories and spot details.'
  },
  'Phonemic awareness': {
    id: 'phonemic_awareness',
    title: 'Sound Blending & Segmenting',
    icon: 'Sparkles',
    emoji: '🧩',
    color: 'from-indigo-600 to-violet-500',
    description: 'Blend sounds together to decode complete words.'
  },
  'Phonics': {
    id: 'phonics',
    title: 'Phonics & Letter Patterns',
    icon: 'Layers',
    emoji: '🔠',
    color: 'from-amber-500 to-orange-400',
    description: 'Master consonant blends and vowel patterns.'
  },
  'Morphology': {
    id: 'morphology',
    title: 'Word Builders (Prefixes & Suffixes)',
    icon: 'PenTool',
    emoji: '🏗️',
    color: 'from-teal-600 to-emerald-500',
    description: 'Discover how word beginnings and endings change meaning.'
  },
  'Decoding': {
    id: 'decoding',
    title: 'Word Decoding & Analysis',
    icon: 'BookOpen',
    emoji: '🔍',
    color: 'from-sky-600 to-blue-500',
    description: 'Break longer words down into syllable chunks.'
  },
  'Advanced decoding': {
    id: 'advanced_decoding',
    title: 'Advanced Word Decoding',
    icon: 'BookOpen',
    emoji: '🚀',
    color: 'from-sky-700 to-indigo-600',
    description: 'Multi-syllable word reading with confidence.'
  },
  'Vocabulary': {
    id: 'vocabulary',
    title: 'Vocabulary Explorer',
    icon: 'Award',
    emoji: '🌟',
    color: 'from-violet-600 to-purple-500',
    description: 'Learn rich new words in interesting contexts.'
  },
  'Oral response': {
    id: 'oral_response',
    title: 'Speaking & Fluency Practice',
    icon: 'Mic',
    emoji: '🗣️',
    color: 'from-rose-600 to-pink-500',
    description: 'Practice speaking aloud with clarity and ease.'
  }
};

// Group DOCX questions by grade and domain
const byGrade = { 'UKG': {}, '1': {}, '2': {}, '3': {} };

DOCX_QUESTION_BANK.forEach(q => {
  const g = q.grade;
  if (!byGrade[g]) byGrade[g] = {};
  const dom = q.domain;
  if (!byGrade[g][dom]) byGrade[g][dom] = [];
  byGrade[g][dom].push(q);
});

const LESSONS_DATA = {};
const GRADES = ['UKG', '1', '2', '3'];

GRADES.forEach(g => {
  const gradeDomains = byGrade[g] || {};
  const domainList = [];
  let globalLessonOrder = 1;

  Object.keys(gradeDomains).forEach(domName => {
    const questions = gradeDomains[domName];
    const meta = DOMAIN_METAS[domName] || {
      id: domName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      title: domName,
      icon: 'BookOpen',
      emoji: '📘',
      color: 'from-indigo-500 to-blue-400',
      description: `Practice key skills in ${domName}.`
    };

    const chunkSize = 5;
    const lessons = [];

    for (let i = 0; i < questions.length; i += chunkSize) {
      const chunk = questions.slice(i, i + chunkSize);
      const lessonNumber = Math.floor(i / chunkSize) + 1;
      const lessonId = `${g.toLowerCase()}_${meta.id}_l${lessonNumber}`;
      const sampleSkill = chunk[0]?.skill || domName;

      lessons.push({
        id: lessonId,
        grade: g,
        domainId: meta.id,
        domain: domName,
        skill: sampleSkill,
        lessonNumber,
        title: `${domName} — Lesson ${lessonNumber}`,
        shortTitle: `Lesson ${lessonNumber}`,
        description: `Practice ${chunk.length} questions on ${sampleSkill.toLowerCase()}.`,
        questionCount: chunk.length,
        questionIds: chunk.map(q => q.id),
        order: globalLessonOrder++
      });
    }

    domainList.push({
      ...meta,
      domainName: domName,
      totalQuestions: questions.length,
      totalLessons: lessons.length,
      lessons
    });
  });

  const totalGradeLessons = domainList.reduce((acc, d) => acc + d.lessons.length, 0);
  const totalGradeQuestions = domainList.reduce((acc, d) => acc + d.totalQuestions, 0);

  LESSONS_DATA[g] = {
    grade: g,
    label: g === 'UKG' ? 'UKG (Age 5–6)' : `Grade ${g} (Age ${Number(g) + 5}–${Number(g) + 6})`,
    totalLessons: totalGradeLessons,
    totalQuestions: totalGradeQuestions,
    domains: domainList
  };
});

const generatedCode = `/**
 * Lessons Mapping Layer for LexiScreen
 * 
 * Maps the 690 verified questions from the question bank into bite-sized, structured lessons (5 questions each).
 * Preserves all original question IDs, grades, domains, skills, and answers intact.
 */

export const LESSONS_DATA = ${JSON.stringify(LESSONS_DATA, null, 2)};

/**
 * Get all lessons for a specific grade
 */
export function getLessonsForGrade(grade) {
  const cleanGrade = String(grade).toUpperCase().replace(/GRADE\\s*/i, '').trim() || 'UKG';
  return LESSONS_DATA[cleanGrade] || LESSONS_DATA['UKG'];
}

/**
 * Find a lesson by its unique lesson ID
 */
export function getLessonById(lessonId) {
  if (!lessonId) return null;
  for (const gradeKey of Object.keys(LESSONS_DATA)) {
    const gradeData = LESSONS_DATA[gradeKey];
    for (const domain of gradeData.domains) {
      const match = domain.lessons.find(l => l.id === lessonId);
      if (match) {
        return {
          ...match,
          domainEmoji: domain.emoji,
          domainColor: domain.color,
          domainTitle: domain.title
        };
      }
    }
  }
  return null;
}

/**
 * Calculate grade lesson progress
 */
export function calculateGradeProgress(grade, completedLessonIds = []) {
  const gradeData = getLessonsForGrade(grade);
  const completedSet = new Set(completedLessonIds);

  let totalCompleted = 0;
  const domainProgress = gradeData.domains.map(dom => {
    const completedCount = dom.lessons.filter(l => completedSet.has(l.id)).length;
    totalCompleted += completedCount;
    const pct = dom.lessons.length > 0 ? Math.round((completedCount / dom.lessons.length) * 100) : 0;
    return {
      domainId: dom.id,
      domainName: dom.domainName,
      title: dom.title,
      emoji: dom.emoji,
      color: dom.color,
      totalLessons: dom.lessons.length,
      completedLessons: completedCount,
      progressPct: pct
    };
  });

  const overallPct = gradeData.totalLessons > 0 ? Math.round((totalCompleted / gradeData.totalLessons) * 100) : 0;

  return {
    grade: gradeData.grade,
    label: gradeData.label,
    totalLessons: gradeData.totalLessons,
    completedLessons: totalCompleted,
    overallProgressPct: overallPct,
    domainProgress
  };
}

/**
 * Determine the next lesson the child should work on
 */
export function getNextAvailableLesson(grade, completedLessonIds = []) {
  const gradeData = getLessonsForGrade(grade);
  const completedSet = new Set(completedLessonIds);

  for (const domain of gradeData.domains) {
    for (const lesson of domain.lessons) {
      if (!completedSet.has(lesson.id)) {
        return {
          ...lesson,
          domainEmoji: domain.emoji,
          domainColor: domain.color,
          domainTitle: domain.title
        };
      }
    }
  }

  // If all completed, return the first lesson for review
  const firstDom = gradeData.domains[0];
  return firstDom && firstDom.lessons[0] ? { ...firstDom.lessons[0], domainEmoji: firstDom.emoji, domainTitle: firstDom.title } : null;
}
`;

fs.writeFileSync(outputPath, generatedCode, 'utf8');
console.log(`Successfully generated lessonsData.js at ${outputPath}`);
console.log('UKG Lessons:', LESSONS_DATA['UKG'].totalLessons, 'Questions:', LESSONS_DATA['UKG'].totalQuestions);
console.log('Grade 1 Lessons:', LESSONS_DATA['1'].totalLessons, 'Questions:', LESSONS_DATA['1'].totalQuestions);
console.log('Grade 2 Lessons:', LESSONS_DATA['2'].totalLessons, 'Questions:', LESSONS_DATA['2'].totalQuestions);
console.log('Grade 3 Lessons:', LESSONS_DATA['3'].totalLessons, 'Questions:', LESSONS_DATA['3'].totalQuestions);
