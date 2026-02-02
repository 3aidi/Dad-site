// Router
class Router {
  constructor() {
    this.routes = {};
    this.currentPath = '';
  }

  on(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname;
    this.currentPath = path;

    // Update active nav
    this.updateActiveNav();

    // Match routes
    if (path === '/' || path === '') {
      this.routes['/']?.();
    } else if (path === '/classes') {
      this.routes['/classes']?.();
    } else if (path.startsWith('/class/')) {
      const classId = path.split('/')[2];
      this.routes['/class/:id']?.(classId);
    } else if (path.startsWith('/unit/')) {
      const unitId = path.split('/')[2];
      this.routes['/unit/:id']?.(unitId);
    } else if (path.startsWith('/lesson/')) {
      const lessonId = path.split('/')[2];
      this.routes['/lesson/:id']?.(lessonId);
    } else {
      this.showError('الصفحة غير موجودة');
    }
  }

  updateActiveNav() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === this.currentPath || (href === '/classes' && this.currentPath.startsWith('/class'))) {
        link.classList.add('active');
      }
    });
  }

  showError(message) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>خطأ</h3>
          <p>${message}</p>
          <button onclick="location.href='/'" class="btn">العودة للرئيسية</button>
        </div>
      `;
    }
  }
}

// Optimized API Helper with timeout and error handling
const api = {
  async get(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطأ في السيرفر' }));
        const errorMsg = errorData.error || `خطأ HTTP ${response.status}`;
        throw new Error(errorMsg);
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الاتصال');
      }
      console.error('API Error:', url, error.message);
      throw error;
    }
  }
};

// Initialize router
const router = new Router();
const app = document.getElementById('app');

// Home Page - Show all classes with their units grouped
router.on('/', async () => {
  try {
    app.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><span>جارٍ تحميل المحتوى...</span></div>`;
    
    // Fetch all classes
    const classes = await api.get('/api/classes');
    
    if (classes.length === 0) {
      app.innerHTML = `
        <h1 class="page-title">مرحبًا بكم أعزائي الطلاب</h1>
        <p class="page-subtitle">لا يوجد محتوى متاح حاليًا. يرجى العودة لاحقًا.</p>
      `;
      return;
    }
    
    // Fetch units for all classes
    const allUnits = await api.get('/api/units');
    
    // Group units by classId
    const unitsByClass = {};
    allUnits.forEach(unit => {
      if (!unitsByClass[unit.class_id]) {
        unitsByClass[unit.class_id] = [];
      }
      unitsByClass[unit.class_id].push(unit);
    });
    
    // Build HTML for each class with its units
    let classesHTML = '';
    
    for (const cls of classes) {
      const classUnits = unitsByClass[cls.id] || [];
      
      let unitsHTML = '';
      if (classUnits.length > 0) {
        unitsHTML = classUnits.map(unit => `
          <div class="list-item" onclick="router.navigate('/unit/${unit.id}')">
            <h4>${escapeHtml(unit.title)}</h4>
            ${unit.description ? `<p>${escapeHtml(unit.description)}</p>` : ''}
            <div class="list-item-icon">
              <i class="fas fa-chevron-left"></i>
            </div>
          </div>
        `).join('');
      } else {
        unitsHTML = '<p style="color: #64748b; padding: 1rem; text-align: center;">لا توجد وحدات متاحة</p>';
      }
      
      classesHTML += `
        <div class="class-section" style="margin-bottom: 2.5rem;">
          <div class="card" style="cursor: default; margin-bottom: 1rem; background: linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%); color: white;">
            <h2 style="color: white; margin: 0; font-size: 1.5rem;">${escapeHtml(cls.name)}</h2>
          </div>
          <div class="list-view">
            ${unitsHTML}
          </div>
        </div>
      `;
    }
    
    app.innerHTML = `
      <h1 class="page-title">مرحبًا بكم أعزائي الطلاب</h1>
      <p class="page-subtitle">جميع الصفوف الدراسية والوحدات مرتبة ومنظمة لكم</p>
      <div class="classes-container">
        ${classesHTML}
      </div>
    `;
    
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>خطأ في تحميل المحتوى</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Classes List Page
router.on('/classes', async () => {
  try {
    app.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><span>جارٍ تحميل الصفوف الدراسية...</span></div>`;
    
    const classes = await api.get('/api/classes');
    
    if (classes.length === 0) {
      app.innerHTML = `
        <h1 class="page-title">الصفوف الدراسية</h1>
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-book-open"></i></div>
          <h3>لا توجد صفوف دراسية متاحة حاليًا</h3>
          <p>يرجى العودة لاحقًا للاطلاع على المحتوى الجديد</p>
        </div>
      `;
      if (window.i18n) window.i18n.translatePage();
      return;
    }

    const classesHTML = classes.map(cls => `
      <div class="card" onclick="router.navigate('/class/${cls.id}')">
        <h3>${escapeHtml(cls.name)}</h3>
        <p>اضغط لعرض الوحدات الدراسية</p>
      </div>
    `).join('');

    app.innerHTML = `
      <h1 class="page-title">الصفوف الدراسية</h1>
      <p class="page-subtitle">اختر صفًا دراسيًا لعرض وحداته ودروسه</p>
      <div class="cards-grid">
        ${classesHTML}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>خطأ في تحميل الصفوف</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Class Detail Page (Units)
router.on('/class/:id', async (classId) => {
  try {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><span>جارٍ تحميل الوحدات...</span></div>';
    
    const [classData, units] = await Promise.all([
      api.get(`/api/classes/${classId}`),
      api.get(`/api/units/class/${classId}`)
    ]);

    const breadcrumbs = `
      <div class="breadcrumbs">
        <a href="/"><i class="fas fa-home"></i> الرئيسية</a>
        <span>«</span>
        <span>${escapeHtml(classData.name)}</span>
      </div>
    `;

    if (units.length === 0) {
      app.innerHTML = `
        ${breadcrumbs}
        <h1 class="page-title">${escapeHtml(classData.name)}</h1>
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-folder-open"></i></div>
          <h3>لا توجد وحدات دراسية متاحة حاليًا</h3>
          <p>هذا الصف لا يحتوي على وحدات دراسية بعد</p>
        </div>
      `;
      return;
    }

    const unitsHTML = units.map(unit => `
      <div class="list-item" onclick="router.navigate('/unit/${unit.id}')">
        <div>
          <h4>${escapeHtml(unit.title)}</h4>
        </div>
        <div class="list-item-icon">
          <i class="fas fa-chevron-left"></i>
        </div>
      </div>
    `).join('');

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(classData.name)}</h1>
      <p class="page-subtitle">اختر وحدة دراسية لعرض دروسها</p>
      <div class="list-view">
        ${unitsHTML}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>خطأ في تحميل الوحدات</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Unit Detail Page (Lessons)
router.on('/unit/:id', async (unitId) => {
  try {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><span>جارٍ تحميل الدروس...</span></div>';
    
    const [unit, lessons] = await Promise.all([
      api.get(`/api/units/${unitId}`),
      api.get(`/api/lessons/unit/${unitId}`)
    ]);

    // Get class info for breadcrumbs
    const classData = await api.get(`/api/classes/${unit.class_id}`);

    const breadcrumbs = `
      <div class="breadcrumbs">
        <a href="/"><i class="fas fa-home"></i> الرئيسية</a>
        <span>«</span>
        <a href="/class/${classData.id}">${escapeHtml(classData.name)}</a>
        <span>«</span>
        <span>${escapeHtml(unit.title)}</span>
      </div>
    `;

    if (lessons.length === 0) {
      app.innerHTML = `
        ${breadcrumbs}
        <h1 class="page-title">${escapeHtml(unit.title)}</h1>
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-file-alt"></i></div>
          <h3>لا توجد دروس متاحة حاليًا</h3>
          <p>هذه الوحدة لا تحتوي على دروس بعد</p>
        </div>
      `;
      return;
    }

    // Group lessons by section/order or display as modern cards
    const lessonsHTML = lessons.map((lesson, index) => `
      <div class="lesson-card" onclick="router.navigate('/lesson/${lesson.id}')">
        <div class="lesson-card-number">${index + 1}</div>
        <div class="lesson-card-content">
          <h3 class="lesson-card-title">${escapeHtml(lesson.title)}</h3>
          ${lesson.description ? `<p class="lesson-card-desc">${escapeHtml(lesson.description)}</p>` : ''}
          <div class="lesson-card-meta">
            <span class="lesson-card-icon"><i class="fas fa-book-open"></i></span>
            <span class="lesson-card-action">ادخل الدرس</span>
          </div>
        </div>
        <div class="lesson-card-arrow">
          <i class="fas fa-arrow-left"></i>
        </div>
      </div>
    `).join('');

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(unit.title)}</h1>
      <p class="page-subtitle">جميع الدروس في هذه الوحدة</p>
      <div class="lessons-modern-grid">
        ${lessonsHTML}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>خطأ في تحميل الدروس</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Lesson Content Page
router.on('/lesson/:id', async (lessonId) => {
  try {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><span>جارٍ تحميل الدرس...</span></div>';
    
    const lesson = await api.get(`/api/lessons/${lessonId}`);
    const unit = await api.get(`/api/units/${lesson.unit_id}`);
    const classData = await api.get(`/api/classes/${unit.class_id}`);

    const breadcrumbs = `
      <div class="breadcrumbs">
        <a href="/"><i class="fas fa-home"></i> الرئيسية</a>
        <span>«</span>
        <a href="/class/${classData.id}">${escapeHtml(classData.name)}</a>
        <span>«</span>
        <a href="/unit/${unit.id}">${escapeHtml(unit.title)}</a>
        <span>«</span>
        <span>${escapeHtml(lesson.title)}</span>
      </div>
    `;

    // Extract videos from lesson
    let videosSections = '';
    if (lesson.videos && Array.isArray(lesson.videos) && lesson.videos.length > 0) {
      videosSections = lesson.videos.map((video) => {
        const videoId = extractYouTubeId(video.video_url);
        if (!videoId) return '';
        
        const size = video.size || 'large';
        const position = video.position || 'bottom';
        const videoEmbed = `
          <div class="video-container video-${size}">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              title="فيديو الدرس"
            ></iframe>
          </div>
        `;
        
        const videoExplanation = video.explanation ? `
          <div class="video-explanation">
            ${video.explanation.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        ` : '';
        
        if (position === 'side') {
          return `
            <div class="video-wrapper video-side">
              <div class="video-embed-section">${videoEmbed}</div>
              <div class="video-caption-section">${videoExplanation}</div>
            </div>
          `;
        } else if (position === 'top') {
          return `
            <div class="video-wrapper video-top-caption">
              ${videoExplanation}
              ${videoEmbed}
            </div>
          `;
        } else {
          return `
            <div class="video-wrapper video-bottom-caption">
              ${videoEmbed}
              ${videoExplanation}
            </div>
          `;
        }
      }).join('');
    }

    // Extract images from lesson
    let imagesSections = '';
    if (lesson.images && Array.isArray(lesson.images) && lesson.images.length > 0) {
      imagesSections = lesson.images.map((image) => {
        const size = image.size || 'medium';
        const position = image.position || 'bottom';
        const imageEmbed = `
          <div class="image-container image-${size}">
            <img src="${image.image_path}" alt="صورة الدرس" style="width: 100%; height: auto; border-radius: 8px;">
          </div>
        `;
        
        const imageCaption = image.caption ? `
          <div class="image-caption">
            ${image.caption.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        ` : '';
        
        if (position === 'side') {
          return `
            <div class="image-wrapper image-side">
              <div class="image-embed-section">${imageEmbed}</div>
              <div class="image-caption-section">${imageCaption}</div>
            </div>
          `;
        } else if (position === 'top') {
          return `
            <div class="image-wrapper image-top-caption">
              ${imageCaption}
              ${imageEmbed}
            </div>
          `;
        } else {
          return `
            <div class="image-wrapper image-bottom-caption">
              ${imageEmbed}
              ${imageCaption}
            </div>
          `;
        }
      }).join('');
    }

    const content = lesson.content 
      ? lesson.content.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('') 
      : '';
    
    const explanationHTML = `${videosSections}${imagesSections}${content ? `<div class="lesson-content">${content}</div>` : ''}`;

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(lesson.title)}</h1>
      
      <div class="lesson-tabs">
        <button class="lesson-tab active" data-tab="explanation">
          <i class="fas fa-book-reader"></i> الشرح
        </button>
        <button class="lesson-tab" data-tab="questions">
          <i class="fas fa-question-circle"></i> بنك الأسئلة
        </button>
      </div>
      
      <div class="tab-content" id="explanation-tab">
        ${explanationHTML || '<p class="no-content">لا يوجد محتوى شرح لهذا الدرس بعد</p>'}
      </div>
      
      <div class="tab-content hidden" id="questions-tab">
        <div class="questions-loading"><i class="fas fa-spinner fa-spin"></i> جارٍ تحميل الأسئلة...</div>
      </div>
    `;
    
    // Tab switching
    const tabs = document.querySelectorAll('.lesson-tab');
    const explanationTab = document.getElementById('explanation-tab');
    const questionsTab = document.getElementById('questions-tab');
    let questionsLoaded = false;
    
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.getAttribute('data-tab');
        if (tabName === 'explanation') {
          explanationTab.classList.remove('hidden');
          questionsTab.classList.add('hidden');
        } else {
          explanationTab.classList.add('hidden');
          questionsTab.classList.remove('hidden');
          
          // Load questions if not loaded
          if (!questionsLoaded) {
            await loadQuestions(lessonId, questionsTab);
            questionsLoaded = true;
          }
        }
      });
    });
    
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>خطأ في تحميل الدرس</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Load and display questions for quiz
async function loadQuestions(lessonId, container) {
  try {
    const questions = await api.get(`/api/lessons/${lessonId}/questions`);
    
    if (!questions || questions.length === 0) {
      container.innerHTML = `
        <div class="no-questions">
          <i class="fas fa-clipboard-list"></i>
          <p>لا توجد أسئلة لهذا الدرس بعد</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-header">
          <h3><i class="fas fa-clipboard-check"></i> اختبر نفسك</h3>
          <p>عدد الأسئلة: ${questions.length}</p>
          <div class="quiz-score" id="quiz-score"></div>
        </div>
        <div class="questions-list" id="questions-list">
          ${questions.map((q, index) => `
            <div class="question-card" id="question-${q.id}">
              <div class="question-number">السؤال ${index + 1}</div>
              <div class="question-text">${escapeHtml(q.question_text)}</div>
              <div class="options-list">
                <label class="option-item" data-option="A">
                  <input type="radio" name="q${q.id}" value="A">
                  <span class="option-letter">أ</span>
                  <span class="option-text">${escapeHtml(q.option_a)}</span>
                </label>
                <label class="option-item" data-option="B">
                  <input type="radio" name="q${q.id}" value="B">
                  <span class="option-letter">ب</span>
                  <span class="option-text">${escapeHtml(q.option_b)}</span>
                </label>
                <label class="option-item" data-option="C">
                  <input type="radio" name="q${q.id}" value="C">
                  <span class="option-letter">ج</span>
                  <span class="option-text">${escapeHtml(q.option_c)}</span>
                </label>
                <label class="option-item" data-option="D">
                  <input type="radio" name="q${q.id}" value="D">
                  <span class="option-letter">د</span>
                  <span class="option-text">${escapeHtml(q.option_d)}</span>
                </label>
              </div>
              <button class="btn btn-check-answer" onclick="checkAnswer(${q.id}, ${lessonId})">
                <i class="fas fa-check"></i> تحقق من الإجابة
              </button>
              <div class="answer-feedback" id="feedback-${q.id}"></div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-submit-quiz" onclick="submitQuiz(${lessonId}, ${JSON.stringify(questions.map(q => q.id)).replace(/"/g, '&quot;')})">
          <i class="fas fa-paper-plane"></i> إرسال جميع الإجابات
        </button>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>فشل تحميل الأسئلة: ${error.message}</p>
      </div>
    `;
  }
}

// Check individual answer
window.checkAnswer = async function(questionId, lessonId) {
  const selected = document.querySelector(`input[name="q${questionId}"]:checked`);
  const feedback = document.getElementById(`feedback-${questionId}`);
  const questionCard = document.getElementById(`question-${questionId}`);
  
  if (!selected) {
    feedback.innerHTML = '<span class="feedback-warning"><i class="fas fa-exclamation-circle"></i> الرجاء اختيار إجابة</span>';
    return;
  }
  
  try {
    const response = await fetch(`/api/lessons/${lessonId}/questions/${questionId}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: selected.value })
    });
    const result = await response.json();
    
    // Disable all options for this question
    const options = questionCard.querySelectorAll('.option-item');
    options.forEach(opt => {
      opt.classList.remove('correct', 'incorrect');
      const optLetter = opt.getAttribute('data-option');
      if (optLetter === result.correctAnswer) {
        opt.classList.add('correct');
      } else if (optLetter === selected.value && !result.correct) {
        opt.classList.add('incorrect');
      }
    });
    
    if (result.correct) {
      feedback.innerHTML = '<span class="feedback-correct"><i class="fas fa-check-circle"></i> إجابة صحيحة! أحسنت</span>';
      questionCard.classList.add('answered-correct');
    } else {
      feedback.innerHTML = '<span class="feedback-incorrect"><i class="fas fa-times-circle"></i> إجابة خاطئة</span>';
      questionCard.classList.add('answered-incorrect');
    }
  } catch (error) {
    feedback.innerHTML = '<span class="feedback-warning"><i class="fas fa-exclamation-circle"></i> حدث خطأ</span>';
  }
};

// Submit all answers
window.submitQuiz = async function(lessonId, questionIds) {
  let correct = 0;
  let total = questionIds.length;
  
  for (const qId of questionIds) {
    const selected = document.querySelector(`input[name="q${qId}"]:checked`);
    if (selected) {
      try {
        const response = await fetch(`/api/lessons/${lessonId}/questions/${qId}/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: selected.value })
        });
        const result = await response.json();
        if (result.correct) correct++;
        
        // Show feedback
        const feedback = document.getElementById(`feedback-${qId}`);
        const questionCard = document.getElementById(`question-${qId}`);
        const options = questionCard.querySelectorAll('.option-item');
        
        options.forEach(opt => {
          opt.classList.remove('correct', 'incorrect');
          const optLetter = opt.getAttribute('data-option');
          if (optLetter === result.correctAnswer) {
            opt.classList.add('correct');
          } else if (optLetter === selected.value && !result.correct) {
            opt.classList.add('incorrect');
          }
        });
        
        if (result.correct) {
          feedback.innerHTML = '<span class="feedback-correct"><i class="fas fa-check-circle"></i> صحيح</span>';
          questionCard.classList.add('answered-correct');
        } else {
          feedback.innerHTML = '<span class="feedback-incorrect"><i class="fas fa-times-circle"></i> خطأ</span>';
          questionCard.classList.add('answered-incorrect');
        }
      } catch (e) {}
    }
  }
  
  const scoreDiv = document.getElementById('quiz-score');
  const percentage = Math.round((correct / total) * 100);
  scoreDiv.innerHTML = `
    <div class="score-result ${percentage >= 50 ? 'score-pass' : 'score-fail'}">
      <i class="fas ${percentage >= 50 ? 'fa-trophy' : 'fa-sad-tear'}"></i>
      <span>النتيجة: ${correct} من ${total} (${percentage}%)</span>
    </div>
  `;
  scoreDiv.scrollIntoView({ behavior: 'smooth' });
};

// Utility function to extract YouTube video ID
function extractYouTubeId(url) {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/v\/)([\w-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle navigation
window.addEventListener('popstate', () => {
  router.handleRoute();
});

document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.href.startsWith(window.location.origin)) {
    e.preventDefault();
    router.navigate(e.target.getAttribute('href'));
  }
});

// Initial route
router.handleRoute();
