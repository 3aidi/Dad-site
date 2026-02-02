const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const router = express.Router();

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary Config - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? `✓ Set (${process.env.CLOUDINARY_CLOUD_NAME})` : '✗ Missing');
console.log('Cloudinary Config - API Key:', process.env.CLOUDINARY_API_KEY ? `✓ Set (${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...)` : '✗ Missing');
console.log('Cloudinary Config - API Secret:', process.env.CLOUDINARY_API_SECRET ? `✓ Set (${process.env.CLOUDINARY_API_SECRET.substring(0, 8)}...)` : '✗ Missing');

// Configure multer for image uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
    const id = req.params.id;
    const lesson = await db.get('SELECT * FROM lessons WHERE id = ?', [id]);
    
    if (!lesson) {
      return res.status(404).json({ error: 'الدرس غير موجود' });
    }
    
    let videos = [];
    let images = [];
    
    try {
      videos = await db.all(
        'SELECT id, lesson_id, video_url, position, size, explanation FROM videos WHERE lesson_id = ? ORDER BY display_order ASC',
        [lesson.id]
      ) || [];
    } catch (videoErr) {
      console.error('Error fetching videos:', videoErr.message);
    }
    
    try {
      images = await db.all(
        'SELECT id, lesson_id, image_path, position, size, caption FROM images WHERE lesson_id = ? ORDER BY display_order ASC',
        [lesson.id]
      ) || [];
    } catch (imageErr) {
      console.error('Error fetching images:', imageErr.message);
    }
    
    res.json({ 
      ...lesson, 
      videos: videos || [],
      images: images || []
    });
  } catch (error) {
    console.error('Error in GET /api/lessons/:id:', error);
    res.status(500).json({ 
      error: 'خطأ في الخادم',
      details: error.message 
    });
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
    const { title, unit_id, content, videos, images } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        error: 'عنوان الدرس مطلوب',
        code: 'TITLE_REQUIRED' 
      });
    }

    if (!unit_id) {
      return res.status(400).json({ 
        error: 'الوحدة الدراسية مطلوبة',
        code: 'UNIT_ID_REQUIRED' 
      });
    }

    const trimmed = title.trim();

    // Validation: Check for Arabic letters only
    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({ 
        error: 'عنوان الدرس يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS' 
      });
    }

    // Verify unit exists
    const unitExists = await db.get('SELECT id FROM units WHERE id = ?', [unit_id]);
    if (!unitExists) {
      return res.status(404).json({ 
        error: 'الوحدة الدراسية غير موجودة',
        code: 'UNIT_NOT_FOUND' 
      });
    }

    // Check for duplicates within the same unit
    const existingLesson = await db.get(
      'SELECT id FROM lessons WHERE unit_id = ? AND title = ?',
      [unit_id, trimmed]
    );

    if (existingLesson) {
      return res.status(409).json({ 
        error: 'هذا العنوان موجود بالفعل في هذه الوحدة. يرجى اختيار عنوان آخر',
        code: 'DUPLICATE_LESSON_TITLE' 
      });
    }

    const result = await db.run(
      'INSERT INTO lessons (title, unit_id, content) VALUES (?, ?, ?)',
      [trimmed, unit_id, content || '']
    );

    // Insert videos if provided
    if (videos && Array.isArray(videos)) {
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (v.video_url) {
          await db.run(
            'INSERT INTO videos (lesson_id, video_url, position, size, explanation, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [result.id, v.video_url, v.video_position || 'bottom', v.video_size || 'large', v.video_explanation || null, i]
          );
        }
      }
    }

    // Insert images if provided
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.image_path) {
          await db.run(
            'INSERT INTO images (lesson_id, image_path, position, size, caption, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [result.id, img.image_path, img.image_position || 'bottom', img.image_size || 'medium', img.image_caption || null, i]
          );
        }
      }
    }

    const newLesson = await db.get('SELECT * FROM lessons WHERE id = ?', [result.id]);
    const lessonsVideos = await db.all(
      'SELECT id, lesson_id, video_url, position, size, explanation FROM videos WHERE lesson_id = ? ORDER BY display_order ASC',
      [result.id]
    );
    const lessonsImages = await db.all(
      'SELECT id, lesson_id, image_path, position, size, caption FROM images WHERE lesson_id = ? ORDER BY display_order ASC',
      [result.id]
    );
    res.status(201).json({ ...newLesson, videos: lessonsVideos, images: lessonsImages });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Update lesson
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, unit_id, content, videos, images } = req.body;
    const { id } = req.params;

    console.log('[PUT /api/lessons/:id] START - Payload:', {
      id,
      title,
      unit_id,
      videosCount: Array.isArray(videos) ? videos.length : 0,
      imagesCount: Array.isArray(images) ? images.length : 0,
      videoDetails: videos,
      imageDetails: images
    });

    // Validation: Check if title is empty
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        error: 'اسم الدرس مطلوب',
        code: 'TITLE_REQUIRED' 
      });
    }

    if (!unit_id) {
      return res.status(400).json({ 
        error: 'الوحدة الدراسية مطلوبة',
        code: 'UNIT_ID_REQUIRED' 
      });
    }

    const trimmedTitle = title.trim();

    // Validation: Check for Arabic letters only
    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicPattern.test(trimmedTitle)) {
      return res.status(400).json({ 
        error: 'يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS' 
      });
    }

    // Verify unit exists
    const unitExists = await db.get('SELECT id FROM units WHERE id = ?', [unit_id]);
    if (!unitExists) {
      return res.status(404).json({ 
        error: 'الوحدة الدراسية غير موجودة',
        code: 'UNIT_NOT_FOUND' 
      });
    }

    // Check for duplicates within the same unit excluding current lesson
    const existingLesson = await db.get(
      'SELECT id FROM lessons WHERE unit_id = ? AND title = ? AND id != ?',
      [unit_id, trimmedTitle, id]
    );

    if (existingLesson) {
      return res.status(409).json({ 
        error: 'هذا الاسم موجود بالفعل',
        code: 'DUPLICATE_LESSON_TITLE' 
      });
    }

    let result;
    try {
      result = await db.run(
        'UPDATE lessons SET title = ?, unit_id = ?, content = ? WHERE id = ?',
        [trimmedTitle, unit_id, content || '', id]
      );
    } catch (updateError) {
      console.error('[PUT /api/lessons/:id] Update error:', updateError);
      return res.status(500).json({
        error: 'حدث خطأ في الخادم',
        stage: 'update_lesson',
        details: updateError.message
      });
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'الدرس غير موجود' });
    }

    // Handle videos: delete old ones and insert new ones
    if (videos && Array.isArray(videos) && videos.length > 0) {
      try {
        console.log('[PUT /api/lessons/:id] Processing videos:', JSON.stringify(videos, null, 2));
        
        // Try to delete old videos - if table doesn't exist, this will fail gracefully
        try {
          await db.run('DELETE FROM videos WHERE lesson_id = ?', [id]);
        } catch (delErr) {
          console.log('[PUT /api/lessons/:id] Note: Could not delete old videos:', delErr.message);
        }
        
        for (let i = 0; i < videos.length; i++) {
          const v = videos[i];
          if (v.video_url) {
            console.log(`[PUT /api/lessons/:id] Inserting video ${i}:`, {
              lesson_id: id,
              video_url: v.video_url,
              position: v.video_position || 'bottom',
              size: v.video_size || 'large',
              explanation: v.video_explanation || null
            });
            await db.run(
              'INSERT INTO videos (lesson_id, video_url, position, size, explanation, display_order) VALUES (?, ?, ?, ?, ?, ?)',
              [id, v.video_url, v.video_position || 'bottom', v.video_size || 'large', v.video_explanation || null, i]
            );
          }
        }
      } catch (videoError) {
        console.error('[PUT /api/lessons/:id] Videos error:', videoError);
        // Don't fail the whole request - just log the error
        console.log('[PUT /api/lessons/:id] Continuing without saving videos');
      }
    }

    // Handle images: delete old ones and insert new ones
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        console.log('[PUT /api/lessons/:id] Processing images:', JSON.stringify(images, null, 2));
        
        // Try to delete old images - if table doesn't exist, this will fail gracefully
        try {
          await db.run('DELETE FROM images WHERE lesson_id = ?', [id]);
        } catch (delErr) {
          console.log('[PUT /api/lessons/:id] Note: Could not delete old images:', delErr.message);
        }
        
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.image_path) {
            console.log(`[PUT /api/lessons/:id] Inserting image ${i}:`, {
              lesson_id: id,
              image_path: img.image_path,
              position: img.image_position || 'bottom',
              size: img.image_size || 'medium',
              caption: img.image_caption || null
            });
            await db.run(
              'INSERT INTO images (lesson_id, image_path, position, size, caption, display_order) VALUES (?, ?, ?, ?, ?, ?)',
              [id, img.image_path, img.image_position || 'bottom', img.image_size || 'medium', img.image_caption || null, i]
            );
          }
        }
      } catch (imageError) {
        console.error('[PUT /api/lessons/:id] Images error:', imageError);
        // Don't fail the whole request - just log the error
        console.log('[PUT /api/lessons/:id] Continuing without saving images');
      }
    }

    const updatedLesson = await db.get('SELECT * FROM lessons WHERE id = ?', [id]);
    
    // Try to get videos and images, but don't fail if tables don't exist
    let lessonsVideos = [];
    let lessonsImages = [];
    try {
      lessonsVideos = await db.all(
        'SELECT id, lesson_id, video_url, position, size, explanation FROM videos WHERE lesson_id = ? ORDER BY display_order ASC',
        [id]
      ) || [];
    } catch (e) {
      console.log('[PUT /api/lessons/:id] Could not fetch videos:', e.message);
    }
    try {
      lessonsImages = await db.all(
        'SELECT id, lesson_id, image_path, position, size, caption FROM images WHERE lesson_id = ? ORDER BY display_order ASC',
        [id]
      ) || [];
    } catch (e) {
      console.log('[PUT /api/lessons/:id] Could not fetch images:', e.message);
    }
    
    console.log('[PUT /api/lessons/:id] SUCCESS - Lesson updated');
    res.json({ ...updatedLesson, videos: lessonsVideos, images: lessonsImages });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({
      error: 'حدث خطأ في الخادم',
      stage: 'unknown',
      details: error.message
    });
  }
});

// ADMIN: Upload image
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم توفير ملف صورة', code: 'NO_FILE' });
    }

    console.log('Uploading image:', req.file.originalname, 'Size:', req.file.size);
    
    // Configure with explicit hardcoded credentials
    cloudinary.config({
      cloud_name: 'dm0srrhnh',
      api_key: '823123349873943',
      api_secret: '2802Hvdcyq4ZFDsF5kE7ZY9dELw'
    });

    const uploadFromBuffer = () => new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'educational-content-system/lesson-images',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error:', error.message, error);
            return reject(error);
          }
          console.log('Image uploaded successfully:', result.secure_url);
          resolve(result);
        }
      );
      
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const result = await uploadFromBuffer();
    res.json({ imagePath: result.secure_url });
  } catch (error) {
    console.error('Error uploading image:', error.message || error);
    res.status(500).json({ 
      error: 'فشل تحميل الصورة: ' + (error.message || 'خطأ غير معروف'),
      code: 'UPLOAD_ERROR'
    });
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

// ==================== QUESTIONS API ====================

// PUBLIC: Get questions for a lesson (for students taking quiz)
router.get('/:lessonId/questions', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const questions = await db.all(
      'SELECT id, lesson_id, question_text, option_a, option_b, option_c, option_d, display_order FROM questions WHERE lesson_id = ? ORDER BY display_order ASC',
      [lessonId]
    );
    // Note: correct_answer is NOT included for students
    res.json(questions || []);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Check answer for a question
router.post('/:lessonId/questions/:questionId/check', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    
    const question = await db.get('SELECT correct_answer FROM questions WHERE id = ?', [questionId]);
    if (!question) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }
    
    const isCorrect = answer.toUpperCase() === question.correct_answer.toUpperCase();
    res.json({ 
      correct: isCorrect,
      correctAnswer: question.correct_answer
    });
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Get questions with answers (for editing)
router.get('/:lessonId/questions/admin', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const questions = await db.all(
      'SELECT * FROM questions WHERE lesson_id = ? ORDER BY display_order ASC',
      [lessonId]
    );
    res.json(questions || []);
  } catch (error) {
    console.error('Error fetching questions for admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Add a question
router.post('/:lessonId/questions', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_answer } = req.body;

    // Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
      return res.status(400).json({ error: 'الإجابة الصحيحة يجب أن تكون A أو B أو C أو D' });
    }

    // Get next display order
    const lastQuestion = await db.get(
      'SELECT MAX(display_order) as max_order FROM questions WHERE lesson_id = ?',
      [lessonId]
    );
    const displayOrder = (lastQuestion?.max_order || 0) + 1;

    const result = await db.run(
      'INSERT INTO questions (lesson_id, question_text, option_a, option_b, option_c, option_d, correct_answer, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [lessonId, question_text, option_a, option_b, option_c, option_d, correct_answer.toUpperCase(), displayOrder]
    );

    const newQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [result.id]);
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Update a question
router.put('/:lessonId/questions/:questionId', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_answer } = req.body;

    // Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
      return res.status(400).json({ error: 'الإجابة الصحيحة يجب أن تكون A أو B أو C أو D' });
    }

    const result = await db.run(
      'UPDATE questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ? WHERE id = ?',
      [question_text, option_a, option_b, option_c, option_d, correct_answer.toUpperCase(), questionId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }

    const updatedQuestion = await db.get('SELECT * FROM questions WHERE id = ?', [questionId]);
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Delete a question
router.delete('/:lessonId/questions/:questionId', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;

    const result = await db.run('DELETE FROM questions WHERE id = ?', [questionId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف السؤال' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
