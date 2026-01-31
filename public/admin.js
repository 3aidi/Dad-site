// Admin Router
class AdminRouter {
  constructor() {
    this.routes = {};
    this.currentUser = null;
  }

  on(path, handler) {
    this.routes[path] = handler;
  }

  async navigate(path) {
    // Check authentication for non-login routes
    if (path !== '/admin/login') {
      const isAuth = await this.checkAuth();
      if (!isAuth) {
        window.history.pushState({}, '', '/admin/login');
        this.handleRoute();
        return;
      }
    }

    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  async checkAuth() {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      if (data.authenticated) {
        this.currentUser = data.admin;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async handleRoute() {
    const path = window.location.pathname;

    if (path === '/admin/login' || path === '/admin') {
      this.routes['/admin/login']?.();
    } else if (path === '/admin/dashboard') {
      this.routes['/admin/dashboard']?.();
    } else if (path === '/admin/classes') {
      this.routes['/admin/classes']?.();
    } else if (path === '/admin/units') {
      this.routes['/admin/units']?.();
    } else if (path === '/admin/lessons') {
      this.routes['/admin/lessons']?.();
    } else {
      this.navigate('/admin/dashboard');
    }
  }
}

// API Helper
const adminApi = {
  async get(url) {
    const response = await fetch(url);
    if (response.status === 401 || response.status === 403) {
      router.navigate('/admin/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.status === 401 || response.status === 403) {
      router.navigate('/admin/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Server error');
    }
    return response.json();
  },

  async put(url, data) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.status === 401 || response.status === 403) {
      router.navigate('/admin/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Server error');
    }
    return response.json();
  },

  async delete(url) {
    const response = await fetch(url, { method: 'DELETE' });
    if (response.status === 401 || response.status === 403) {
      router.navigate('/admin/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      throw new Error('Delete failed');
    }
    return response.json();
  }
};

// Initialize
const router = new AdminRouter();
const app = document.getElementById('admin-app');

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showAlert(message, type = 'success') {
  const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
  const alert = document.createElement('div');
  alert.className = `alert ${alertClass}`;
  alert.innerHTML = `<span>${escapeHtml(message)}</span>`;
  
  const content = document.querySelector('.admin-content');
  if (content) {
    content.insertBefore(alert, content.firstChild);
    setTimeout(() => alert.remove(), 5000);
  }
}

// Admin Layout Template
function adminLayout(content, activeNav) {
  return `
    <div class="admin-layout">
      <aside class="sidebar">
        <h2>Admin Panel</h2>
        <nav>
          <a href="/admin/dashboard" class="${activeNav === 'dashboard' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/dashboard')">
            📊 Dashboard
          </a>
          <a href="/admin/classes" class="${activeNav === 'classes' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/classes')">
            📚 Classes
          </a>
          <a href="/admin/units" class="${activeNav === 'units' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/units')">
            📖 Units
          </a>
          <a href="/admin/lessons" class="${activeNav === 'lessons' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/lessons')">
            📄 Lessons
          </a>
        </nav>
        <div class="sidebar-footer">
          <p>Logged in as: <strong>${router.currentUser?.username || 'Admin'}</strong></p>
          <button class="btn btn-danger btn-block btn-sm" onclick="logout()">Logout</button>
        </div>
      </aside>
      <main class="admin-main">
        ${content}
      </main>
    </div>
  `;
}

async function logout() {
  try {
    await adminApi.post('/api/auth/logout', {});
    router.navigate('/admin/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Login Page
router.on('/admin/login', async () => {
  // Check if already logged in
  const isAuth = await router.checkAuth();
  if (isAuth) {
    router.navigate('/admin/dashboard');
    return;
  }

  app.innerHTML = `
    <div class="login-container">
      <div class="login-box">
        <h1>Admin Login</h1>
        <p>Educational Content System</p>
        <form id="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autofocus>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <div id="login-error" style="display: none;" class="alert alert-error"></div>
          <button type="submit" class="btn btn-primary btn-block">Login</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
      await adminApi.post('/api/auth/login', { username, password });
      router.navigate('/admin/dashboard');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    }
  });
});

// Dashboard
router.on('/admin/dashboard', async () => {
  try {
    const [classes, units, lessons] = await Promise.all([
      adminApi.get('/api/classes'),
      adminApi.get('/api/units'),
      adminApi.get('/api/lessons')
    ]);

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>Dashboard</h1>
      </div>
      <div class="admin-content">
        <h2>Content Overview</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 2rem;">
          <div style="background: var(--light-bg); padding: 2rem; border-radius: 8px; text-align: center;">
            <h3 style="font-size: 3rem; color: var(--secondary-color);">${classes.length}</h3>
            <p>Classes</p>
          </div>
          <div style="background: var(--light-bg); padding: 2rem; border-radius: 8px; text-align: center;">
            <h3 style="font-size: 3rem; color: var(--success-color);">${units.length}</h3>
            <p>Units</p>
          </div>
          <div style="background: var(--light-bg); padding: 2rem; border-radius: 8px; text-align: center;">
            <h3 style="font-size: 3rem; color: var(--warning-color);">${lessons.length}</h3>
            <p>Lessons</p>
          </div>
        </div>
        <div style="margin-top: 3rem;">
          <h3>Quick Actions</h3>
          <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="router.navigate('/admin/classes')">Manage Classes</button>
            <button class="btn btn-success" onclick="router.navigate('/admin/units')">Manage Units</button>
            <button class="btn btn-secondary" onclick="router.navigate('/admin/lessons')">Manage Lessons</button>
          </div>
        </div>
      </div>
    `, 'dashboard');
  } catch (error) {
    app.innerHTML = adminLayout(`<div class="alert alert-error">Error loading dashboard</div>`, 'dashboard');
  }
});

// Classes Management
router.on('/admin/classes', async () => {
  try {
    const classes = await adminApi.get('/api/classes');

    const tableRows = classes.length === 0 
      ? '<tr><td colspan="3" class="empty-state"><div class="empty-state-icon">📚</div><p>No classes yet. Create your first class!</p></td></tr>'
      : classes.map(cls => `
          <tr>
            <td>${escapeHtml(cls.name)}</td>
            <td>${new Date(cls.created_at).toLocaleDateString()}</td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="editClass(${cls.id}, '${escapeHtml(cls.name).replace(/'/g, "\\'")}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteClass(${cls.id}, '${escapeHtml(cls.name).replace(/'/g, "\\'")}')">Delete</button>
            </td>
          </tr>
        `).join('');

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>Manage Classes</h1>
        <button class="btn btn-success" onclick="showCreateClassForm()">+ New Class</button>
      </div>
      <div class="admin-content">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `, 'classes');
  } catch (error) {
    app.innerHTML = adminLayout(`<div class="alert alert-error">Error loading classes</div>`, 'classes');
  }
});

window.showCreateClassForm = function() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create New Class</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="create-class-form">
        <div class="form-group">
          <label for="class-name">Class Name *</label>
          <input type="text" id="class-name" required autofocus>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-success">Create Class</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('create-class-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await adminApi.post('/api/classes', {
        name: document.getElementById('class-name').value
      });
      modal.remove();
      router.navigate('/admin/classes');
      showAlert('Class created successfully!');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });
};

window.editClass = function(id, name) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Class</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="edit-class-form">
        <div class="form-group">
          <label for="edit-class-name">Class Name *</label>
          <input type="text" id="edit-class-name" value="${name}" required autofocus>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update Class</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('edit-class-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await adminApi.put(`/api/classes/${id}`, {
        name: document.getElementById('edit-class-name').value
      });
      modal.remove();
      router.navigate('/admin/classes');
      showAlert('Class updated successfully!');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });
};

window.deleteClass = async function(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis will also delete all units and lessons in this class.`)) {
    return;
  }
  
  try {
    await adminApi.delete(`/api/classes/${id}`);
    router.navigate('/admin/classes');
    showAlert('Class deleted successfully!');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// Units Management (similar pattern - continuing in next part)
router.on('/admin/units', async () => {
  try {
    const [units, classes] = await Promise.all([
      adminApi.get('/api/units'),
      adminApi.get('/api/classes')
    ]);

    window.availableClasses = classes;

    const tableRows = units.length === 0 
      ? '<tr><td colspan="4" class="empty-state"><div class="empty-state-icon">📖</div><p>No units yet. Create your first unit!</p></td></tr>'
      : units.map(unit => `
          <tr>
            <td>${escapeHtml(unit.title)}</td>
            <td>${escapeHtml(unit.class_name)}</td>
            <td>${new Date(unit.created_at).toLocaleDateString()}</td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="editUnit(${unit.id}, '${escapeHtml(unit.title).replace(/'/g, "\\'")}', ${unit.class_id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUnit(${unit.id}, '${escapeHtml(unit.title).replace(/'/g, "\\'")}')">Delete</button>
            </td>
          </tr>
        `).join('');

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>Manage Units</h1>
        <button class="btn btn-success" onclick="showCreateUnitForm()">+ New Unit</button>
      </div>
      <div class="admin-content">
        ${classes.length === 0 ? '<div class="alert alert-info">Create a class first before adding units.</div>' : ''}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Unit Title</th>
                <th>Class</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `, 'units');
  } catch (error) {
    app.innerHTML = adminLayout(`<div class="alert alert-error">Error loading units</div>`, 'units');
  }
});

window.showCreateUnitForm = function() {
  const classOptions = window.availableClasses.map(cls => 
    `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create New Unit</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="create-unit-form">
        <div class="form-group">
          <label for="unit-title">Unit Title *</label>
          <input type="text" id="unit-title" required autofocus>
        </div>
        <div class="form-group">
          <label for="unit-class">Class *</label>
          <select id="unit-class" required>
            <option value="">Select a class...</option>
            ${classOptions}
          </select>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-success">Create Unit</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('create-unit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await adminApi.post('/api/units', {
        title: document.getElementById('unit-title').value,
        class_id: document.getElementById('unit-class').value
      });
      modal.remove();
      router.navigate('/admin/units');
      showAlert('Unit created successfully!');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });
};

window.editUnit = function(id, title, classId) {
  const classOptions = window.availableClasses.map(cls => 
    `<option value="${cls.id}" ${cls.id === classId ? 'selected' : ''}>${escapeHtml(cls.name)}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Edit Unit</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="edit-unit-form">
        <div class="form-group">
          <label for="edit-unit-title">Unit Title *</label>
          <input type="text" id="edit-unit-title" value="${title}" required autofocus>
        </div>
        <div class="form-group">
          <label for="edit-unit-class">Class *</label>
          <select id="edit-unit-class" required>
            ${classOptions}
          </select>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">Update Unit</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('edit-unit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await adminApi.put(`/api/units/${id}`, {
        title: document.getElementById('edit-unit-title').value,
        class_id: document.getElementById('edit-unit-class').value
      });
      modal.remove();
      router.navigate('/admin/units');
      showAlert('Unit updated successfully!');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });
};

window.deleteUnit = async function(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis will also delete all lessons in this unit.`)) {
    return;
  }
  
  try {
    await adminApi.delete(`/api/units/${id}`);
    router.navigate('/admin/units');
    showAlert('Unit deleted successfully!');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// Lessons Management
router.on('/admin/lessons', async () => {
  try {
    const [lessons, units] = await Promise.all([
      adminApi.get('/api/lessons'),
      adminApi.get('/api/units')
    ]);

    window.availableUnits = units;

    const tableRows = lessons.length === 0 
      ? '<tr><td colspan="5" class="empty-state"><div class="empty-state-icon">📄</div><p>No lessons yet. Create your first lesson!</p></td></tr>'
      : lessons.map(lesson => `
          <tr>
            <td>${escapeHtml(lesson.title)}</td>
            <td>${escapeHtml(lesson.unit_title)}</td>
            <td>${escapeHtml(lesson.class_name)}</td>
            <td>${new Date(lesson.created_at).toLocaleDateString()}</td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="editLesson(${lesson.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id}, '${escapeHtml(lesson.title).replace(/'/g, "\\'")}')">Delete</button>
            </td>
          </tr>
        `).join('');

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>Manage Lessons</h1>
        <button class="btn btn-success" onclick="showCreateLessonForm()">+ New Lesson</button>
      </div>
      <div class="admin-content">
        ${units.length === 0 ? '<div class="alert alert-info">Create a unit first before adding lessons.</div>' : ''}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Lesson Title</th>
                <th>Unit</th>
                <th>Class</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `, 'lessons');
  } catch (error) {
    app.innerHTML = adminLayout(`<div class="alert alert-error">Error loading lessons</div>`, 'lessons');
  }
});

window.showCreateLessonForm = function() {
  const unitOptions = window.availableUnits.map(unit => 
    `<option value="${unit.id}">${escapeHtml(unit.title)} (${escapeHtml(unit.class_name)})</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create New Lesson</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="create-lesson-form">
        <div class="form-group">
          <label for="lesson-title">Lesson Title *</label>
          <input type="text" id="lesson-title" required autofocus>
        </div>
        <div class="form-group">
          <label for="lesson-unit">Unit *</label>
          <select id="lesson-unit" required>
            <option value="">Select a unit...</option>
            ${unitOptions}
          </select>
        </div>
        <div class="form-group">
          <label for="lesson-content">Lesson Content</label>
          <textarea id="lesson-content" placeholder="Enter lesson content here..."></textarea>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-success">Create Lesson</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('create-lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await adminApi.post('/api/lessons', {
        title: document.getElementById('lesson-title').value,
        unit_id: document.getElementById('lesson-unit').value,
        content: document.getElementById('lesson-content').value
      });
      modal.remove();
      router.navigate('/admin/lessons');
      showAlert('Lesson created successfully!');
    } catch (error) {
      showAlert(error.message, 'error');
    }
  });
};

window.editLesson = async function(id) {
  try {
    const lesson = await adminApi.get(`/api/lessons/${id}`);
    const unitOptions = window.availableUnits.map(unit => 
      `<option value="${unit.id}" ${unit.id === lesson.unit_id ? 'selected' : ''}>${escapeHtml(unit.title)} (${escapeHtml(unit.class_name)})</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Lesson</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <form id="edit-lesson-form">
          <div class="form-group">
            <label for="edit-lesson-title">Lesson Title *</label>
            <input type="text" id="edit-lesson-title" value="${escapeHtml(lesson.title)}" required autofocus>
          </div>
          <div class="form-group">
            <label for="edit-lesson-unit">Unit *</label>
            <select id="edit-lesson-unit" required>
              ${unitOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="edit-lesson-content">Lesson Content</label>
            <textarea id="edit-lesson-content">${escapeHtml(lesson.content || '')}</textarea>
          </div>
          <div class="btn-group">
            <button type="submit" class="btn btn-primary">Update Lesson</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('edit-lesson-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await adminApi.put(`/api/lessons/${id}`, {
          title: document.getElementById('edit-lesson-title').value,
          unit_id: document.getElementById('edit-lesson-unit').value,
          content: document.getElementById('edit-lesson-content').value
        });
        modal.remove();
        router.navigate('/admin/lessons');
        showAlert('Lesson updated successfully!');
      } catch (error) {
        showAlert(error.message, 'error');
      }
    });
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

window.deleteLesson = async function(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) {
    return;
  }
  
  try {
    await adminApi.delete(`/api/lessons/${id}`);
    router.navigate('/admin/lessons');
    showAlert('Lesson deleted successfully!');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// Handle navigation
window.addEventListener('popstate', () => {
  router.handleRoute();
});

// Initial route
router.handleRoute();
