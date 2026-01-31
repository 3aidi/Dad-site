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
        <h3>Error</h3>
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
    <h1 class="page-title">Welcome to Educational Content System</h1>
    <p class="page-subtitle">Browse our comprehensive collection of teaching materials organized by classes, units, and lessons.</p>
    
    <div class="cards-grid">
      <div class="card" onclick="router.navigate('/classes')">
        <h3>📚 Browse Classes</h3>
        <p>Explore all available classes and their content</p>
      </div>
      <div class="card" style="cursor: default; opacity: 0.7;">
        <h3>ℹ️ About</h3>
        <p>This is a content presentation system for educational materials</p>
      </div>
    </div>
  `;
});

// Classes List Page
router.on('/classes', async () => {
  try {
    app.innerHTML = '<div class="loading">Loading classes...</div>';
    
    const classes = await api.get('/api/classes');
    
    if (classes.length === 0) {
      app.innerHTML = `
        <h1 class="page-title">Classes</h1>
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>No classes available yet</h3>
          <p>Check back later for new content</p>
        </div>
      `;
      return;
    }

    const classesHTML = classes.map(cls => `
      <div class="card" onclick="router.navigate('/class/${cls.id}')">
        <h3>${escapeHtml(cls.name)}</h3>
        <p>Click to view units</p>
      </div>
    `).join('');

    app.innerHTML = `
      <h1 class="page-title">Classes</h1>
      <p class="page-subtitle">Select a class to view its units and lessons</p>
      <div class="cards-grid">
        ${classesHTML}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <h3>Error loading classes</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Class Detail Page (Units)
router.on('/class/:id', async (classId) => {
  try {
    app.innerHTML = '<div class="loading">Loading units...</div>';
    
    const [classData, units] = await Promise.all([
      api.get(`/api/classes/${classId}`),
      api.get(`/api/units/class/${classId}`)
    ]);

    const breadcrumbs = `
      <div class="breadcrumbs">
        <a href="/classes">Classes</a>
        <span>›</span>
        <span>${escapeHtml(classData.name)}</span>
      </div>
    `;

    if (units.length === 0) {
      app.innerHTML = `
        ${breadcrumbs}
        <h1 class="page-title">${escapeHtml(classData.name)}</h1>
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <h3>No units available yet</h3>
          <p>This class doesn't have any units yet</p>
        </div>
      `;
      return;
    }

    const unitsHTML = units.map(unit => `
      <div class="list-item" onclick="router.navigate('/unit/${unit.id}')">
        <h3>${escapeHtml(unit.title)}</h3>
        <span class="arrow">→</span>
      </div>
    `).join('');

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(classData.name)}</h1>
      <p class="page-subtitle">Select a unit to view its lessons</p>
      <div class="list-view">
        ${unitsHTML}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <h3>Error loading units</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Unit Detail Page (Lessons)
router.on('/unit/:id', async (unitId) => {
  try {
    app.innerHTML = '<div class="loading">Loading lessons...</div>';
    
    const [unit, lessons] = await Promise.all([
      api.get(`/api/units/${unitId}`),
      api.get(`/api/lessons/unit/${unitId}`)
    ]);

    // Get class info for breadcrumbs
    const classData = await api.get(`/api/classes/${unit.class_id}`);

    const breadcrumbs = `
      <div class="breadcrumbs">
        <a href="/classes">Classes</a>
        <span>›</span>
        <a href="/class/${classData.id}">${escapeHtml(classData.name)}</a>
        <span>›</span>
        <span>${escapeHtml(unit.title)}</span>
      </div>
    `;

    if (lessons.length === 0) {
      app.innerHTML = `
        ${breadcrumbs}
        <h1 class="page-title">${escapeHtml(unit.title)}</h1>
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <h3>No lessons available yet</h3>
          <p>This unit doesn't have any lessons yet</p>
        </div>
      `;
      return;
    }

    const lessonsHTML = lessons.map(lesson => `
      <div class="list-item" onclick="router.navigate('/lesson/${lesson.id}')">
        <h3>${escapeHtml(lesson.title)}</h3>
        <span class="arrow">→</span>
      </div>
    `).join('');

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(unit.title)}</h1>
      <p class="page-subtitle">Select a lesson to view its content</p>
      <div class="list-view">
        ${lessonsHTML}
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="error">
        <h3>Error loading lessons</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
});

// Lesson Content Page
router.on('/lesson/:id', async (lessonId) => {
  try {
    app.innerHTML = '<div class="loading">Loading lesson...</div>';
    
    const lesson = await api.get(`/api/lessons/${lessonId}`);
    const unit = await api.get(`/api/units/${lesson.unit_id}`);
    const classData = await api.get(`/api/classes/${unit.class_id}`);

    const breadcrumbs = `
      <div class="breadcrumbs">
        <a href="/classes">Classes</a>
        <span>›</span>
        <a href="/class/${classData.id}">${escapeHtml(classData.name)}</a>
        <span>›</span>
        <a href="/unit/${unit.id}">${escapeHtml(unit.title)}</a>
        <span>›</span>
        <span>${escapeHtml(lesson.title)}</span>
      </div>
    `;

    const content = lesson.content 
      ? lesson.content.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('') 
      : '<p><em>No content available for this lesson yet.</em></p>';

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
        <h3>Error loading lesson</h3>
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
