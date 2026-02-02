// Optimized Educational Platform - app.js
(function() {
  'use strict';

  // Simple Router
  const router = {
    routes: {},
    on(path, handler) { this.routes[path] = handler; },
    navigate(path) {
      history.pushState({}, '', path);
      this.handleRoute();
    },
    handleRoute() {
      const path = location.pathname;
      this.updateNav();
      
      if (path === '/' || !path) this.routes['/']?.();
      else if (path === '/classes') this.routes['/classes']?.();
      else if (path.startsWith('/class/')) this.routes['/class/:id']?.(path.split('/')[2]);
      else if (path.startsWith('/unit/')) this.routes['/unit/:id']?.(path.split('/')[2]);
      else if (path.startsWith('/lesson/')) this.routes['/lesson/:id']?.(path.split('/')[2]);
      else this.showError('الصفحة غير موجودة');
    },
    updateNav() {
      const path = location.pathname;
      document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === path || (href === '/classes' && path.startsWith('/class')));
      });
    },
    showError(msg) {
      app.innerHTML = `<div class="error"><h3>خطأ</h3><p>${msg}</p><a href="/" class="btn">العودة</a></div>`;
    }
  };

  // API Helper
  const api = {
    async get(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'خطأ في السيرفر');
        return res.json();
      } catch (e) {
        throw e;
      }
    }
  };

  const app = document.getElementById('app');
  const escapeHtml = text => { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; };
  
  const extractYouTubeId = url => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return m?.[1] || null;
  };

  // Mobile Menu
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.onclick = () => { hamburger.classList.toggle('active'); mobileMenu.classList.toggle('active'); };
    mobileMenu.querySelectorAll('a').forEach(a => a.onclick = () => { hamburger.classList.remove('active'); mobileMenu.classList.remove('active'); });
    document.onclick = e => { if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) { hamburger.classList.remove('active'); mobileMenu.classList.remove('active'); } };
  }

  // Home
  router.on('/', () => {
    app.innerHTML = `
      <h1 class="page-title">مرحبًا بكم أعزائي الطلاب</h1>
      <p class="page-subtitle">جميع الدروس والمحتوى التعليمي المنظم حسب الصفوف والوحدات</p>
      <div class="cards-grid">
        <div class="card" onclick="router.navigate('/classes')">
          <h3>📚 الصفوف الدراسية</h3>
          <p>استكشفوا جميع الصفوف الدراسية المتاحة</p>
        </div>
        <div class="card" style="cursor:default;opacity:.7">
          <h3>ℹ️ حول المنصة</h3>
          <p>منصة لعرض أعمالي التعليمية ومساعدة طلابي</p>
        </div>
      </div>
    `;
  });

  // Classes List
  router.on('/classes', async () => {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
      const classes = await api.get('/api/classes');
      if (!classes.length) {
        app.innerHTML = `<h1 class="page-title">الصفوف الدراسية</h1><div class="empty-state"><p>لا توجد صفوف دراسية متاحة حاليًا</p></div>`;
        return;
      }
      app.innerHTML = `
        <h1 class="page-title">الصفوف الدراسية</h1>
        <p class="page-subtitle">اختر صفًا دراسيًا لعرض وحداته</p>
        <div class="cards-grid">${classes.map(c => `<div class="card" onclick="router.navigate('/class/${c.id}')"><h3>${escapeHtml(c.name)}</h3><p>اضغط لعرض الوحدات</p></div>`).join('')}</div>
      `;
    } catch (e) {
      app.innerHTML = `<div class="error"><h3>خطأ في تحميل الصفوف</h3><p>${e.message}</p></div>`;
    }
  });

  // Class Detail (Units)
  router.on('/class/:id', async (id) => {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
      const [cls, units] = await Promise.all([api.get(`/api/classes/${id}`), api.get(`/api/units/class/${id}`)]);
      const bc = `<div class="breadcrumbs"><a href="/classes">الصفوف</a><span>«</span><span>${escapeHtml(cls.name)}</span></div>`;
      if (!units.length) {
        app.innerHTML = `${bc}<h1 class="page-title">${escapeHtml(cls.name)}</h1><div class="empty-state"><p>لا توجد وحدات دراسية</p></div>`;
        return;
      }
      app.innerHTML = `${bc}<h1 class="page-title">${escapeHtml(cls.name)}</h1><p class="page-subtitle">اختر وحدة دراسية</p>
        <div class="list-view">${units.map(u => `<div class="list-item" onclick="router.navigate('/unit/${u.id}')"><h4>${escapeHtml(u.title)}</h4><div class="list-item-icon">«</div></div>`).join('')}</div>`;
    } catch (e) {
      app.innerHTML = `<div class="error"><h3>خطأ</h3><p>${e.message}</p></div>`;
    }
  });

  // Unit Detail (Lessons)
  router.on('/unit/:id', async (id) => {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
      const [unit, lessons] = await Promise.all([api.get(`/api/units/${id}`), api.get(`/api/lessons/unit/${id}`)]);
      const cls = await api.get(`/api/classes/${unit.class_id}`);
      const bc = `<div class="breadcrumbs"><a href="/classes">الصفوف</a><span>«</span><a href="/class/${cls.id}">${escapeHtml(cls.name)}</a><span>«</span><span>${escapeHtml(unit.title)}</span></div>`;
      if (!lessons.length) {
        app.innerHTML = `${bc}<h1 class="page-title">${escapeHtml(unit.title)}</h1><div class="empty-state"><p>لا توجد دروس</p></div>`;
        return;
      }
      app.innerHTML = `${bc}<h1 class="page-title">${escapeHtml(unit.title)}</h1><p class="page-subtitle">اختر درسًا</p>
        <div class="list-view">${lessons.map(l => `<div class="list-item" onclick="router.navigate('/lesson/${l.id}')"><h4>${escapeHtml(l.title)}</h4><div class="list-item-icon">«</div></div>`).join('')}</div>`;
    } catch (e) {
      app.innerHTML = `<div class="error"><h3>خطأ</h3><p>${e.message}</p></div>`;
    }
  });

  // Lesson Content
  router.on('/lesson/:id', async (id) => {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
      const lesson = await api.get(`/api/lessons/${id}`);
      const unit = await api.get(`/api/units/${lesson.unit_id}`);
      const cls = await api.get(`/api/classes/${unit.class_id}`);
      
      const bc = `<div class="breadcrumbs"><a href="/classes">الصفوف</a><span>«</span><a href="/class/${cls.id}">${escapeHtml(cls.name)}</a><span>«</span><a href="/unit/${unit.id}">${escapeHtml(unit.title)}</a><span>«</span><span>${escapeHtml(lesson.title)}</span></div>`;

      // Build videos
      let videos = '';
      if (lesson.videos?.length) {
        videos = lesson.videos.map(v => {
          const vid = extractYouTubeId(v.video_url);
          if (!vid) return '';
          const embed = `<div class="video-container video-${v.size||'large'}"><iframe src="https://www.youtube.com/embed/${vid}?rel=0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
          const exp = v.explanation ? `<div class="video-explanation">${v.explanation.split('\n').map(l => `<p>${escapeHtml(l)}</p>`).join('')}</div>` : '';
          return `<div class="video-wrapper">${embed}${exp}</div>`;
        }).join('');
      }

      // Build images
      let images = '';
      if (lesson.images?.length) {
        images = lesson.images.map(img => {
          const imgEl = `<div class="image-container image-${img.size||'medium'}"><img src="${img.image_path}" alt="صورة الدرس" loading="lazy"></div>`;
          const cap = img.caption ? `<div class="image-caption">${img.caption.split('\n').map(l => `<p>${escapeHtml(l)}</p>`).join('')}</div>` : '';
          return `<div class="image-wrapper">${imgEl}${cap}</div>`;
        }).join('');
      }

      const content = lesson.content ? `<div class="lesson-content">${lesson.content.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div>` : '';
      const explanation = videos + images + content || '<p class="no-content">لا يوجد محتوى شرح لهذا الدرس بعد</p>';

      app.innerHTML = `${bc}<h1 class="page-title">${escapeHtml(lesson.title)}</h1>
        <div class="lesson-tabs">
          <button class="lesson-tab active" data-tab="explanation">الشرح</button>
          <button class="lesson-tab" data-tab="questions">بنك الأسئلة</button>
        </div>
        <div class="tab-content" id="explanation-tab">${explanation}</div>
        <div class="tab-content hidden" id="questions-tab"><div class="questions-loading"><i class="fas fa-spinner fa-spin"></i> جارٍ تحميل الأسئلة...</div></div>
      `;

      // Tab switching
      let questionsLoaded = false;
      document.querySelectorAll('.lesson-tab').forEach(tab => {
        tab.onclick = async () => {
          document.querySelectorAll('.lesson-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const isExp = tab.dataset.tab === 'explanation';
          document.getElementById('explanation-tab').classList.toggle('hidden', !isExp);
          document.getElementById('questions-tab').classList.toggle('hidden', isExp);
          if (!isExp && !questionsLoaded) {
            await loadQuestions(id);
            questionsLoaded = true;
          }
        };
      });
    } catch (e) {
      app.innerHTML = `<div class="error"><h3>خطأ</h3><p>${e.message}</p></div>`;
    }
  });

  // Load Questions
  async function loadQuestions(lessonId) {
    const container = document.getElementById('questions-tab');
    try {
      const questions = await api.get(`/api/lessons/${lessonId}/questions`);
      if (!questions?.length) {
        container.innerHTML = '<div class="no-questions"><i class="fas fa-clipboard-list"></i><p>لا توجد أسئلة لهذا الدرس بعد</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="quiz-container">
          <div class="quiz-header"><h3>اختبر نفسك</h3><p>عدد الأسئلة: ${questions.length}</p><div class="quiz-score" id="quiz-score"></div></div>
          <div class="questions-list">${questions.map((q, i) => `
            <div class="question-card" id="q-${q.id}">
              <div class="question-number">السؤال ${i + 1}</div>
              <div class="question-text">${escapeHtml(q.question_text)}</div>
              <div class="options-list">
                ${['A', 'B', 'C', 'D'].map((opt, j) => `<label class="option-item" data-option="${opt}"><input type="radio" name="q${q.id}" value="${opt}"><span class="option-letter">${['أ', 'ب', 'ج', 'د'][j]}</span><span class="option-text">${escapeHtml(q['option_' + opt.toLowerCase()])}</span></label>`).join('')}
              </div>
              <button class="btn-check-answer" onclick="checkAnswer(${q.id},${lessonId})">تحقق</button>
              <div class="answer-feedback" id="fb-${q.id}"></div>
            </div>
          `).join('')}</div>
          <button class="btn-submit-quiz" onclick="submitQuiz(${lessonId},[${questions.map(q => q.id).join(',')}])">إرسال جميع الإجابات</button>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="error"><p>فشل تحميل الأسئلة: ${e.message}</p></div>`;
    }
  }

  // Check Answer
  window.checkAnswer = async (qId, lessonId) => {
    const selected = document.querySelector(`input[name="q${qId}"]:checked`);
    const fb = document.getElementById(`fb-${qId}`);
    if (!selected) { fb.innerHTML = '<span class="feedback-warning">اختر إجابة</span>'; return; }
    try {
      const res = await fetch(`/api/lessons/${lessonId}/questions/${qId}/check`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: selected.value })
      });
      const r = await res.json();
      const card = document.getElementById(`q-${qId}`);
      card.querySelectorAll('.option-item').forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        const letter = opt.dataset.option;
        if (letter === r.correctAnswer) opt.classList.add('correct');
        else if (letter === selected.value && !r.correct) opt.classList.add('incorrect');
      });
      card.classList.add(r.correct ? 'answered-correct' : 'answered-incorrect');
      fb.innerHTML = r.correct ? '<span class="feedback-correct">✓ صحيح</span>' : '<span class="feedback-incorrect">✗ خطأ</span>';
    } catch (e) { fb.innerHTML = '<span class="feedback-warning">خطأ</span>'; }
  };

  // Submit Quiz
  window.submitQuiz = async (lessonId, qIds) => {
    let correct = 0;
    for (const qId of qIds) {
      const selected = document.querySelector(`input[name="q${qId}"]:checked`);
      if (selected) {
        try {
          const res = await fetch(`/api/lessons/${lessonId}/questions/${qId}/check`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: selected.value })
          });
          const r = await res.json();
          if (r.correct) correct++;
          const card = document.getElementById(`q-${qId}`);
          const fb = document.getElementById(`fb-${qId}`);
          card.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('correct', 'incorrect');
            if (opt.dataset.option === r.correctAnswer) opt.classList.add('correct');
            else if (opt.dataset.option === selected.value && !r.correct) opt.classList.add('incorrect');
          });
          card.classList.add(r.correct ? 'answered-correct' : 'answered-incorrect');
          fb.innerHTML = r.correct ? '<span class="feedback-correct">✓</span>' : '<span class="feedback-incorrect">✗</span>';
        } catch (e) {}
      }
    }
    const pct = Math.round((correct / qIds.length) * 100);
    const scoreDiv = document.getElementById('quiz-score');
    scoreDiv.innerHTML = `<div class="score-result ${pct >= 50 ? 'score-pass' : 'score-fail'}">${pct >= 50 ? '🏆' : '😢'} النتيجة: ${correct}/${qIds.length} (${pct}%)</div>`;
    scoreDiv.scrollIntoView({ behavior: 'smooth' });
  };

  // Navigation
  window.addEventListener('popstate', () => router.handleRoute());
  document.addEventListener('click', e => {
    if (e.target.tagName === 'A' && e.target.href?.startsWith(location.origin) && !e.target.href.includes('/admin')) {
      e.preventDefault();
      router.navigate(e.target.getAttribute('href'));
    }
  });

  // Expose router globally
  window.router = router;
  
  // Initial route
  router.handleRoute();
})();
