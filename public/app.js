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
      this.showError('Page not found');
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
    app.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>خطأ</h3>
        <p>${message}</p>
      </div>
    `;
  }
}

// API Helper
const api = {
  async get(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

// Initialize router
const router = new Router();
const app = document.getElementById('app');

// Home Page
router.on('/', async () => {
  app.innerHTML = `
    <h1 class="page-title">مرحبًا بكم في منصة الأستاذ سعد عبد الفتاح العايدي التعليمية</h1>
    <p class="page-subtitle">استعرضوا مجموعتنا الشاملة من المواد التعليمية المنظمة بعناية حسب الصفوف الدراسية والوحدات والدروس</p>
    
    <div class="cards-grid">
      <div class="card" onclick="router.navigate('/classes')">
        <h3>الصفوف الدراسية</h3>
        <p>استكشفوا جميع الصفوف الدراسية المتاحة ومحتوياتها التعليمية المتميزة</p>
      </div>
      <div class="card" style="cursor: default; opacity: 0.7;">
        <h3>حول المنصة</h3>
        <p>منصة تعليمية متطورة مصممة من قبل الأستاذ سعد عبد الفتاح العايدي لتقديم أفضل تجربة تعليمية</p>
      </div>
    </div>
  `;
});

// Classes List Page
router.on('/classes', async () => {
  try {
    app.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><span>جارٍ تحميل الصفوف الدراسية...</span></div>';
    
    const classes = await api.get('/api/classes');
    
    if (classes.length === 0) {
      app.innerHTML = `
        <h1 class="page-title">الصفوف الدراسية</h1>
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-book-open"></i></div>
          <h3>لا توجد صلوف دراسية متاحة حاليًا</h3>
          <p>يرجى العودة لاحقًا للاطلاع على المحتوى الجديد</p>
        </div>
      `;
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
        <a href="/classes"><i class="fas fa-book-open"></i> الصفوف الدراسية</a>
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
        <a href="/classes"><i class="fas fa-book-open"></i> الصفوف</a>
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

    const lessonsHTML = lessons.map(lesson => `
      <div class="list-item" onclick="router.navigate('/lesson/${lesson.id}')">
        <div>
          <h4>${escapeHtml(lesson.title)}</h4>
        </div>
        <div class="list-item-icon">
          <i class="fas fa-chevron-left"></i>
        </div>
      </div>
    `).join('');

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(unit.title)}</h1>
      <p class="page-subtitle">اختر درسًا لعرض محتواه</p>
      <div class="list-view">
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
        <a href="/classes"><i class="fas fa-book-open"></i> الصفوف</a>
        <span>«</span>
        <a href="/class/${classData.id}">${escapeHtml(classData.name)}</a>
        <span>«</span>
        <a href="/unit/${unit.id}">${escapeHtml(unit.title)}</a>
        <span>«</span>
        <span>${escapeHtml(lesson.title)}</span>
      </div>
    `;

    const content = lesson.content 
      ? lesson.content.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('') 
      : '<p><em>لا يوجد محتوى متاح لهذا الدرس حاليًا.</em></p>';

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(lesson.title)}</h1>
      <div class="lesson-content">
        ${content}
      </div>
    `;
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
