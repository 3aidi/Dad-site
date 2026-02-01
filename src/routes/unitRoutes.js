const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// PUBLIC: Get units by class ID
router.get('/class/:classId', async (req, res) => {
  try {
    const units = await db.all(
      'SELECT * FROM units WHERE class_id = ? ORDER BY created_at ASC',
      [req.params.classId]
    );
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get single unit
router.get('/:id', async (req, res) => {
  try {
    const unit = await db.get('SELECT * FROM units WHERE id = ?', [req.params.id]);
    
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Get all units (for admin panel)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const units = await db.all(`
      SELECT u.*, c.name as class_name 
      FROM units u 
      JOIN classes c ON u.class_id = c.id 
      ORDER BY u.created_at DESC
    `);
    res.json(units);
  } catch (error) {
    console.error('Error fetching all units:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create unit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, class_id } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        error: 'عنوان الوحدة مطلوب',
        code: 'TITLE_REQUIRED' 
      });
    }

    if (!class_id) {
      return res.status(400).json({ 
        error: 'الصف الدراسي مطلوب',
        code: 'CLASS_ID_REQUIRED' 
      });
    }

    const trimmed = title.trim();

    // Validation: Check for Arabic letters only
    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({ 
        error: 'عنوان الوحدة يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS' 
      });
    }

    // Verify class exists
    const classExists = await db.get('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (!classExists) {
      return res.status(404).json({ 
        error: 'الصف الدراسي غير موجود',
        code: 'CLASS_NOT_FOUND' 
      });
    }

    // Check for duplicates within the same class
    const existingUnit = await db.get(
      'SELECT id FROM units WHERE class_id = ? AND title = ?',
      [class_id, trimmed]
    );

    if (existingUnit) {
      return res.status(409).json({ 
        error: 'هذا العنوان موجود بالفعل في هذا الصف. يرجى اختيار عنوان آخر',
        code: 'DUPLICATE_UNIT_TITLE' 
      });
    }

    const result = await db.run(
      'INSERT INTO units (title, class_id) VALUES (?, ?)',
      [trimmed, class_id]
    );

    const newUnit = await db.get('SELECT * FROM units WHERE id = ?', [result.id]);
    res.status(201).json(newUnit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ADMIN: Update unit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, class_id } = req.body;
    const { id } = req.params;

    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        error: 'عنوان الوحدة مطلوب',
        code: 'TITLE_REQUIRED' 
      });
    }

    if (!class_id) {
      return res.status(400).json({ 
        error: 'الصف الدراسي مطلوب',
        code: 'CLASS_ID_REQUIRED' 
      });
    }

    const trimmed = title.trim();

    // Validation: Check for Arabic letters only
    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({ 
        error: 'عنوان الوحدة يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS' 
      });
    }

    // Verify class exists
    const classExists = await db.get('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (!classExists) {
      return res.status(404).json({ 
        error: 'الصف الدراسي غير موجود',
        code: 'CLASS_NOT_FOUND' 
      });
    }

    // Check for duplicates within the same class excluding current unit
    const existingUnit = await db.get(
      'SELECT id FROM units WHERE class_id = ? AND title = ? AND id != ?',
      [class_id, trimmed, id]
    );

    if (existingUnit) {
      return res.status(409).json({ 
        error: 'هذا العنوان موجود بالفعل في هذا الصف. يرجى اختيار عنوان آخر',
        code: 'DUPLICATE_UNIT_TITLE' 
      });
    }

    const result = await db.run(
      'UPDATE units SET title = ?, class_id = ? WHERE id = ?',
      [trimmed, class_id, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'الوحدة غير موجودة' });
    }

    const updatedUnit = await db.get('SELECT * FROM units WHERE id = ?', [id]);
    res.json(updatedUnit);
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ADMIN: Delete unit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM units WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json({ success: true, message: 'Unit deleted' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
