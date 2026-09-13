import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';
import { authenticateToken } from './authRoutes.js';

export const childRouter = express.Router();
childRouter.use(authenticateToken);

// GET /api/children - List all children for the current parent/teacher
childRouter.get('/', (req, res) => {
  try {
    const parentId = req.user.id;
    const children = db.find('children', c => c.parentId === parentId);
    res.json({ children });
  } catch (err) {
    console.error('[Children] List error:', err);
    res.status(500).json({ error: 'Failed to retrieve child profiles.' });
  }
});

// GET /api/children/:id - Get a specific child profile
childRouter.get('/:id', (req, res) => {
  try {
    const parentId = req.user.id;
    const child = db.findOne('children', c => c.id === req.params.id && c.parentId === parentId);
    if (!child) {
      return res.status(404).json({ error: 'Child profile not found.' });
    }
    res.json({ child });
  } catch (err) {
    console.error('[Children] Get error:', err);
    res.status(500).json({ error: 'Failed to retrieve child profile.' });
  }
});

// POST /api/children - Create new child profile
childRouter.post('/', (req, res) => {
  try {
    const parentId = req.user.id;
    const { name, age, grade, notes, consentConfirmed, signatureName } = req.body;

    if (!name || !age || !grade) {
      return res.status(400).json({ error: 'Child name/pseudonym, age, and grade are required.' });
    }

    if (!consentConfirmed) {
      return res.status(400).json({
        error: 'Explicit parental/guardian consent is mandatory before activating a child profile for screening.'
      });
    }

    const childId = `child_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    // 1. Create Child Record
    const newChild = db.insert('children', {
      id: childId,
      parentId,
      name: name.trim(),
      age: Number(age),
      grade: String(grade).trim(),
      notes: notes ? notes.trim() : '',
      consentConfirmed: true,
      consentDate: now,
      createdAt: now
    });

    // 2. Record Immutable Consent Audit Record
    db.insert('consentRecords', {
      id: uuidv4(),
      childId: newChild.id,
      parentId,
      signatureName: signatureName ? signatureName.trim() : req.user.name,
      consentType: 'PRELIMINARY_SCREENING_NON_MEDICAL',
      disclaimerAcknowledged: true,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: now
    });

    res.status(201).json({
      message: 'Child profile created and consent verified.',
      child: newChild
    });
  } catch (err) {
    console.error('[Children] Create error:', err);
    res.status(500).json({ error: 'Failed to create child profile.' });
  }
});

// PUT /api/children/:id - Update child profile
childRouter.put('/:id', (req, res) => {
  try {
    const parentId = req.user.id;
    const child = db.findOne('children', c => c.id === req.params.id && c.parentId === parentId);
    if (!child) {
      return res.status(404).json({ error: 'Child profile not found.' });
    }

    const { name, age, grade, notes } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (age !== undefined) updates.age = Number(age);
    if (grade !== undefined) updates.grade = String(grade).trim();
    if (notes !== undefined) updates.notes = notes.trim();

    const updatedChild = db.update('children', child.id, updates);
    res.json({ message: 'Child profile updated.', child: updatedChild });
  } catch (err) {
    console.error('[Children] Update error:', err);
    res.status(500).json({ error: 'Failed to update child profile.' });
  }
});

// POST /api/children/:id/consent - Record / re-affirm consent
childRouter.post('/:id/consent', (req, res) => {
  try {
    const parentId = req.user.id;
    const child = db.findOne('children', c => c.id === req.params.id && c.parentId === parentId);
    if (!child) {
      return res.status(404).json({ error: 'Child profile not found.' });
    }

    const { signatureName, confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({ error: 'Consent confirmation is required.' });
    }

    const now = new Date().toISOString();
    const updatedChild = db.update('children', child.id, {
      consentConfirmed: true,
      consentDate: now
    });

    db.insert('consentRecords', {
      id: uuidv4(),
      childId: child.id,
      parentId,
      signatureName: signatureName || req.user.name,
      consentType: 'PRELIMINARY_SCREENING_NON_MEDICAL',
      disclaimerAcknowledged: true,
      timestamp: now
    });

    res.json({ message: 'Consent reaffirmed.', child: updatedChild });
  } catch (err) {
    console.error('[Children] Consent error:', err);
    res.status(500).json({ error: 'Failed to record consent.' });
  }
});
