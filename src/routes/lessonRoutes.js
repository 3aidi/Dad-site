const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// PUBLIC: Get lessons by unit ID
router.get('/unit/:unitId', async (req, res) => {
  try {
    const lessons = await db.all(
      'SELECT id, unit_id, title, created_at FROM lessons WHERE unit_id = ? ORDER BY created_at ASC',
      [req.params.unitId]
    );
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get single lesson with full content
router.get('/:id', async (req, res) => {
  try {
    const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Get all lessons (for admin panel)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const lessons = await db.all(`
      SELECT l.*, u.title as unit_title, c.name as class_name 
      FROM lessons l 
      JOIN units u ON l.unit_id = u.id 
      JOIN classes c ON u.class_id = c.id 
      ORDER BY l.created_at DESC
    `);
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching all lessons:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create lesson
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, unit_id, content } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Lesson title is required' });
    }

    if (!unit_id) {
      return res.status(400).json({ error: 'Unit ID is required' });
    }

    // Verify unit exists
    const unitExists = await db.get('SELECT id FROM units WHERE id = ?', [unit_id]);
    if (!unitExists) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const result = await db.run(
      'INSERT INTO lessons (title, unit_id, content) VALUES (?, ?, ?)',
      [title.trim(), unit_id, content || '']
    );

    const newLesson = await db.get('SELECT * FROM lessons WHERE id = ?', [result.id]);
    res.status(201).json(newLesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Update lesson
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, unit_id, content } = req.body;
    const { id } = req.params;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Lesson title is required' });
    }

    if (!unit_id) {
      return res.status(400).json({ error: 'Unit ID is required' });
    }

    // Verify unit exists
    const unitExists = await db.get('SELECT id FROM units WHERE id = ?', [unit_id]);
    if (!unitExists) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const result = await db.run(
      'UPDATE lessons SET title = ?, unit_id = ?, content = ? WHERE id = ?',
      [title.trim(), unit_id, content || '', id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const updatedLesson = await db.get('SELECT * FROM lessons WHERE id = ?', [id]);
    res.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Delete lesson
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM lessons WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
