const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// PUBLIC: Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await db.all('SELECT * FROM classes ORDER BY created_at DESC');
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get single class
router.get('/:id', async (req, res) => {
  try {
    const classItem = await db.get('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(classItem);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create class
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const result = await db.run(
      'INSERT INTO classes (name) VALUES (?)',
      [name.trim()]
    );

    const newClass = await db.get('SELECT * FROM classes WHERE id = ?', [result.id]);
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Update class
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const result = await db.run(
      'UPDATE classes SET name = ? WHERE id = ?',
      [name.trim(), id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const updatedClass = await db.get('SELECT * FROM classes WHERE id = ?', [id]);
    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Delete class
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM classes WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
