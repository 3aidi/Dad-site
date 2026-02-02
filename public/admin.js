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
      const data = await safeParseJson(response);
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

    if (path === '/admin/login' || path === '/admin' || path === '/admin.html') {
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

function safeParseJson(response) {
  return response.text().then(text => {
    if (!text) {
      return response.ok ? {} : null;
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      return response.ok ? {} : null;
    }
  });
}

// API Helper
const adminApi = {
  async get(url) {
    try {
      const response = await fetch(url);
      if (response.status === 401 || response.status === 403) {
        router.navigate('/admin/login');
        throw new Error('غير مصرح');
      }
      if (!response.ok) {
        const errorData = await safeParseJson(response);
        console.error('API GET Error:', url, errorData);
        throw new Error(errorData?.error || errorData?.message || 'فشل تحميل البيانات');
      }
      return safeParseJson(response);
    } catch (error) {
      console.error('API GET Exception:', url, error);
      throw error;
    }
  },

  async post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.status === 401 || response.status === 403) {
        router.navigate('/admin/login');
        throw new Error('غير مصرح');
      }
      if (!response.ok) {
        const error = await safeParseJson(response);
        throw new Error(error.error || 'حدث خطأ');
      }
      return safeParseJson(response);
    } catch (error) {
      throw error;
    }
  },

  async put(url, data) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.status === 401 || response.status === 403) {
        router.navigate('/admin/login');
        throw new Error('غير مصرح');
      }
      if (!response.ok) {
        const error = await safeParseJson(response);
        throw new Error(error.error || 'فشل التحديث');
      }
      return safeParseJson(response);
    } catch (error) {
      throw error;
    }
  },

  async delete(url) {
    try {
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 401 || response.status === 403) {
        router.navigate('/admin/login');
        throw new Error('غير مصرح');
      }
      if (!response.ok) {
        throw new Error('فشل الحذف');
      }
      return safeParseJson(response);
    } catch (error) {
      throw error;
    }
  }
};

// Initialize
const router = new AdminRouter();
const app = document.getElementById('admin-app');

console.log('Admin app element:', app);
console.log('Router initialized:', router);

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

function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h2>${escapeHtml(title)}</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div style="padding: 1.5rem; color: #334155; line-height: 1.6;">
          ${message}
        </div>
        <div class="btn-group">
          <button class="btn btn-danger" onclick="this.closest('.modal').remove(); window.confirmResult = true; window.dispatchEvent(new Event('confirmResolved'));">
            <i class="fas fa-trash"></i> نعم، احذفه
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); window.confirmResult = false; window.dispatchEvent(new Event('confirmResolved'));">
            <i class="fas fa-times"></i> إلغاء
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    window.addEventListener('confirmResolved', function handler() {
      window.removeEventListener('confirmResolved', handler);
      resolve(window.confirmResult);
    }, { once: true });
  });
}

// Admin Layout Template
function adminLayout(content, activeNav) {
  return `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <h2>الأستاذ سعد العايدي</h2>
          <p>إدارة المحتوى التعليمي</p>
        </div>
        <nav>
          <a href="/admin/dashboard" class="${activeNav === 'dashboard' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/dashboard')">
            <i class="fas fa-chart-line"></i> لوحة المعلومات
          </a>
          <a href="/admin/classes" class="${activeNav === 'classes' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/classes')">
            <i class="fas fa-book-open"></i> الصفوف الدراسية
          </a>
          <a href="/admin/units" class="${activeNav === 'units' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/units')">
            <i class="fas fa-folder-open"></i> الوحدات الدراسية
          </a>
          <a href="/admin/lessons" class="${activeNav === 'lessons' ? 'active' : ''}" onclick="event.preventDefault(); router.navigate('/admin/lessons')">
            <i class="fas fa-file-alt"></i> الدروس
          </a>
        </nav>
        <div class="sidebar-footer" dir="rtl">
          <p>مسجل الدخول:</p>
          <div class="teacher-badge-admin">
            <span>${router.currentUser?.username || 'مدير'}</span>
            <i class="fas fa-user-tie"></i>
          </div>
          <button class="logout-badge" onclick="logout()">تسجيل الخروج <i class="fas fa-sign-out-alt"></i></button>
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
  console.log('Login route triggered, app element:', app);
  
  if (!app) {
    console.error('Admin app element not found!');
    return;
  }
  
  app.innerHTML = `
    <div class="login-container">
      <div class="welcome-header">
        <div class="teacher-badge">
          <i class="fas fa-graduation-cap"></i>
          <span>الأستاذ سعد عبد الفتاح العايدي</span>
        </div>
      </div>
      <div class="login-form-wrapper">
        <div class="container">
          <div class="heading">تسجيل الدخول</div>

            <form id="login-form" class="form" onsubmit="return false;">
              <input required class="input" type="text" name="username" id="username" placeholder="اسم المستخدم" />
              <input required class="input" type="password" name="password" id="password" placeholder="كلمة المرور" />
              <span class="forgot-password"><a href="#">هل نسيت كلمة المرور؟</a></span>
              <div id="login-error" style="display: none;" class="alert alert-error"></div>
              <input class="login-button" type="submit" value="دخول" />
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await safeParseJson(response);
        const message = response.status === 401
          ? 'كلمة المرور غير صحيحة'
          : (data.error || 'حدث خطأ');
        throw new Error(message);
      }

      await safeParseJson(response);
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
        <h1>لوحة المعلومات</h1>
        <p>نظرة عامة على المحتوى التعليمي</p>
      </div>
      <div class="admin-content">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>الصفوف الدراسية</h3>
            <div class="number">${classes.length}</div>
          </div>
          <div class="stat-card">
            <h3>الوحدات الدراسية</h3>
            <div class="number">${units.length}</div>
          </div>
          <div class="stat-card">
            <h3>الدروس</h3>
            <div class="number">${lessons.length}</div>
          </div>
        </div>
        <div class="quick-actions">
          <h3>إجراءات سريعة</h3>
          <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="router.navigate('/admin/classes')"><i class="fas fa-book-open"></i> إدارة الصفوف</button>
            <button class="btn btn-primary" onclick="router.navigate('/admin/units')"><i class="fas fa-folder-open"></i> إدارة الوحدات</button>
            <button class="btn btn-primary" onclick="router.navigate('/admin/lessons')"><i class="fas fa-file-alt"></i> إدارة الدروس</button>
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
      ? '<tr><td colspan="3" class="empty-state"><div class="empty-state-icon"><i class="fas fa-book"></i></div><p>لا توجد صفوف دراسية بعد. قم بإنشاء صف دراسي أول!</p></td></tr>'
      : classes.map(cls => `
          <tr>
            <td>${escapeHtml(cls.name || cls.name_ar)}</td>
            <td>${new Date(cls.created_at).toLocaleDateString('ar-EG')}</td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="editClass(${cls.id}, '${escapeHtml((cls.name || cls.name_ar)).replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i> تعديل</button>
              <button class="btn btn-sm btn-danger" onclick="deleteClass(${cls.id}, '${escapeHtml((cls.name || cls.name_ar)).replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i> حذف</button>
            </td>
          </tr>
        `).join('');

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>إدارة الصفوف الدراسية</h1>
        <button class="btn btn-primary" onclick="showCreateClassForm()"><i class="fas fa-plus"></i> صف جديد</button>
      </div>
      <div class="admin-content">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم الصف</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
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
        <h2>إضافة صف دراسي جديد</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <form id="create-class-form">
        <div class="form-group">
          <label for="class-name"><i class="fas fa-book-open"></i> اسم الصف *</label>
          <input type="text" id="class-name" required autofocus placeholder="مثال: الصف الأول" dir="rtl">
          <small style="color: #666;">يرجى إدخال اسم الصف بالأحرف العربية فقط</small>
        </div>
        <div style="color: #ef4444; margin: 1rem 0; padding: 0.75rem; background: #fee2e2; border-radius: 4px; display: none;" id="class-error">
          <i class="fas fa-exclamation-circle"></i> <span id="class-error-msg"></span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ الصف</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i> إلغاء</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const classNameInput = document.getElementById('class-name');
  const errorDiv = document.getElementById('class-error');
  const errorMsg = document.getElementById('class-error-msg');

  // Real-time Arabic validation
  classNameInput.addEventListener('input', (e) => {
    const arabicPattern = /^[\u0600-\u06FF\s]*$/;
    if (e.target.value && !arabicPattern.test(e.target.value)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
    } else {
      errorDiv.style.display = 'none';
    }
  });

  document.getElementById('create-class-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = classNameInput.value.trim();

    // Client-side validation
    if (!name) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'اسم الصف مطلوب';
      return;
    }

    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicPattern.test(name)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
      return;
    }

    try {
      await adminApi.post('/api/classes', { name });
      modal.remove();
      router.navigate('/admin/classes');
      showAlert('تم إضافة الصف بنجاح!');
    } catch (error) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = error.message;
    }
  });
};

window.editClass = function(id, name) {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>تعديل الصف الدراسي</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <form id="edit-class-form">
        <div class="form-group">
          <label for="edit-class-name"><i class="fas fa-book-open"></i> اسم الصف *</label>
          <input type="text" id="edit-class-name" value="${escapeHtml(name || '')}" required autofocus dir="rtl">
          <small style="color: #666;">يرجى إدخال اسم الصف بالأحرف العربية فقط</small>
        </div>
        <div style="color: #ef4444; margin: 1rem 0; padding: 0.75rem; background: #fee2e2; border-radius: 4px; display: none;" id="edit-class-error">
          <i class="fas fa-exclamation-circle"></i> <span id="edit-class-error-msg"></span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ التغييرات</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i> إلغاء</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const classNameInput = document.getElementById('edit-class-name');
  const errorDiv = document.getElementById('edit-class-error');
  const errorMsg = document.getElementById('edit-class-error-msg');

  // Real-time Arabic validation
  classNameInput.addEventListener('input', (e) => {
    const arabicPattern = /^[\u0600-\u06FF\s]*$/;
    if (e.target.value && !arabicPattern.test(e.target.value)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
    } else {
      errorDiv.style.display = 'none';
    }
  });

  document.getElementById('edit-class-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameVal = classNameInput.value.trim();

    // Client-side validation
    if (!nameVal) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'اسم الصف مطلوب';
      return;
    }

    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicPattern.test(nameVal)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
      return;
    }

    try {
      await adminApi.put(`/api/classes/${id}`, { name: nameVal });
      modal.remove();
      router.navigate('/admin/classes');
      showAlert('تم تحديث الصف بنجاح!');
    } catch (error) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = error.message;
    }
  });
};

window.deleteClass = async function(id, name) {
  const confirmed = await showConfirmModal(
    'حذف الصف الدراسي',
    `<p>هل أنت متأكد من حذف "<strong>${escapeHtml(name)}</strong>"؟</p><p style="color: #ef4444; margin-top: 0.5rem; font-size: 0.9rem;"><i class="fas fa-exclamation-triangle"></i> سيتم حذف جميع الوحدات والدروس التابعة لهذا الصف.</p>`
  );
  
  if (!confirmed) return;
  
  try {
    await adminApi.delete(`/api/classes/${id}`);
    router.navigate('/admin/classes');
    showAlert('تم حذف الصف بنجاح!');
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
      ? '<tr><td colspan="4" class="empty-state"><div class="empty-state-icon"><i class="fas fa-folder"></i></div><p>لا توجد وحدات دراسية بعد. قم بإنشاء وحدة دراسية أولى!</p></td></tr>'
      : units.map(unit => `
          <tr>
            <td>${escapeHtml(unit.title || unit.title_ar)}</td>
            <td>${escapeHtml(unit.class_name)}</td>
            <td>${new Date(unit.created_at).toLocaleDateString('ar-EG')}</td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="editUnit(${unit.id}, '${escapeHtml((unit.title || unit.title_ar)).replace(/'/g, "\\'")}', ${unit.class_id})">تعديل</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUnit(${unit.id}, '${escapeHtml((unit.title || unit.title_ar)).replace(/'/g, "\\'")}')">حذف</button>
            </td>
          </tr>
        `).join('');

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>إدارة الوحدات الدراسية</h1>
        <button class="btn btn-primary" onclick="showCreateUnitForm()"><i class="fas fa-plus"></i> وحدة جديدة</button>
      </div>
      <div class="admin-content">
        ${classes.length === 0 ? '<div class="alert alert-info">قم بإنشاء صف دراسي أولا قبل إضافة الوحدات.</div>' : ''}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>عنوان الوحدة</th>
                <th>Class</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
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
    `<option value="${cls.id}">${escapeHtml(cls.name || cls.name_ar)}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>إضافة وحدة دراسية جديدة</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="create-unit-form">
        <div class="form-group">
          <label for="unit-title">عنوان الوحدة *</label>
          <input type="text" id="unit-title" required autofocus placeholder="مثال: الوحدة الأولى" dir="rtl">
          <small style="color: #666;">يرجى إدخال عنوان الوحدة بالأحرف العربية فقط</small>
        </div>
        <div class="form-group">
          <label for="unit-class">الصف الدراسي *</label>
          <select id="unit-class" required>
            <option value="">اختر صفا دراسيا...</option>
            ${classOptions}
          </select>
        </div>
        <div style="color: #ef4444; margin: 1rem 0; padding: 0.75rem; background: #fee2e2; border-radius: 4px; display: none;" id="unit-error">
          <i class="fas fa-exclamation-circle"></i> <span id="unit-error-msg"></span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-success">حفظ الوحدة</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const titleInput = document.getElementById('unit-title');
  const errorDiv = document.getElementById('unit-error');
  const errorMsg = document.getElementById('unit-error-msg');

  // Real-time Arabic validation
  titleInput.addEventListener('input', (e) => {
    const arabicPattern = /^[\u0600-\u06FF\s]*$/;
    if (e.target.value && !arabicPattern.test(e.target.value)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
    } else {
      errorDiv.style.display = 'none';
    }
  });

  document.getElementById('create-unit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const classId = document.getElementById('unit-class').value;

    if (!title) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'عنوان الوحدة مطلوب';
      return;
    }
    if (!classId) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'الصف الدراسي مطلوب';
      return;
    }

    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicPattern.test(title)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
      return;
    }

    try {
      await adminApi.post('/api/units', {
        title,
        class_id: classId
      });
      modal.remove();
      router.navigate('/admin/units');
      showAlert('تم إضافة الوحدة بنجاح!');
    } catch (error) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = error.message;
    }
  });
};

window.editUnit = function(id, title, classId) {
  const classOptions = window.availableClasses.map(cls => 
    `<option value="${cls.id}" ${cls.id === classId ? 'selected' : ''}>${escapeHtml(cls.name || cls.name_ar)}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>تعديل الوحدة</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="edit-unit-form">
        <div class="form-group">
          <label for="edit-unit-title">عنوان الوحدة *</label>
          <input type="text" id="edit-unit-title" value="${escapeHtml(title || '')}" required autofocus dir="rtl">
          <small style="color: #666;">يرجى إدخال عنوان الوحدة بالأحرف العربية فقط</small>
        </div>
        <div class="form-group">
          <label for="edit-unit-class">الصف الدراسي *</label>
          <select id="edit-unit-class" required>
            ${classOptions}
          </select>
        </div>
        <div style="color: #ef4444; margin: 1rem 0; padding: 0.75rem; background: #fee2e2; border-radius: 4px; display: none;" id="edit-unit-error">
          <i class="fas fa-exclamation-circle"></i> <span id="edit-unit-error-msg"></span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const titleInput = document.getElementById('edit-unit-title');
  const errorDiv = document.getElementById('edit-unit-error');
  const errorMsg = document.getElementById('edit-unit-error-msg');

  // Real-time Arabic validation
  titleInput.addEventListener('input', (e) => {
    const arabicPattern = /^[\u0600-\u06FF\s]*$/;
    if (e.target.value && !arabicPattern.test(e.target.value)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
    } else {
      errorDiv.style.display = 'none';
    }
  });

  document.getElementById('edit-unit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titleVal = titleInput.value.trim();
    const classIdVal = document.getElementById('edit-unit-class').value;

    if (!titleVal) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'عنوان الوحدة مطلوب';
      return;
    }

    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicPattern.test(titleVal)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
      return;
    }

    try {
      await adminApi.put(`/api/units/${id}`, {
        title: titleVal,
        class_id: classIdVal
      });
      modal.remove();
      router.navigate('/admin/units');
      showAlert('تم تحديث الوحدة بنجاح!');
    } catch (error) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = error.message;
    }
  });
};

window.deleteUnit = async function(id, title) {
  const confirmed = await showConfirmModal(
    'حذف الوحدة الدراسية',
    `<p>هل أنت متأكد من حذف "<strong>${escapeHtml(title)}</strong>"؟</p><p style="color: #ef4444; margin-top: 0.5rem; font-size: 0.9rem;"><i class="fas fa-exclamation-triangle"></i> سيتم حذف جميع الدروس التابعة لهذه الوحدة.</p>`
  );
  
  if (!confirmed) return;
  
  try {
    await adminApi.delete(`/api/units/${id}`);
    router.navigate('/admin/units');
    showAlert('تم حذف الوحدة بنجاح!');
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
      ? '<tr><td colspan="5" class="empty-state"><div class="empty-state-icon"><i class="fas fa-file-alt"></i></div><p>لا توجد دروس بعد. قم بإنشاء درس أول!</p></td></tr>'
      : lessons.map(lesson => `
          <tr>
            <td>${escapeHtml(lesson.title || lesson.title_ar)}</td>
            <td>${escapeHtml(lesson.unit_title)}</td>
            <td>${escapeHtml(lesson.class_name)}</td>
            <td>${new Date(lesson.created_at).toLocaleDateString()}</td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="editLesson(${lesson.id})">تعديل</button>
              <button class="btn btn-sm btn-danger" onclick="deleteLesson(${lesson.id}, '${escapeHtml((lesson.title || lesson.title_ar)).replace(/'/g, "\\'")}')">حذف</button>
            </td>
          </tr>
        `).join('');

    app.innerHTML = adminLayout(`
      <div class="admin-header">
        <h1>إدارة الدروس</h1>
        <button class="btn btn-primary" onclick="showCreateLessonForm()"><i class="fas fa-plus"></i> درس جديد</button>
      </div>
      <div class="admin-content">
        ${units.length === 0 ? '<div class="alert alert-info">قم بإنشاء وحدة دراسية أولا قبل إضافة الدروس.</div>' : ''}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>عنوان الدرس</th>
                <th>Unit</th>
                <th>Class</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
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
    `<option value="${unit.id}">${escapeHtml(unit.title || unit.title_ar)} (${escapeHtml(unit.class_name)})</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>إضافة درس جديد</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="create-lesson-form">
        <div class="form-group">
          <label for="lesson-title">عنوان الدرس *</label>
          <input type="text" id="lesson-title" required autofocus placeholder="مثال: درس الفيزياء" dir="rtl">
          <small style="color: #666;">يرجى إدخال عنوان الدرس بالأحرف العربية فقط</small>
        </div>
        <div class="form-group">
          <label for="lesson-unit">الوحدة الدراسية *</label>
          <select id="lesson-unit" required>
            <option value="">اختر وحدة دراسية...</option>
            ${unitOptions}
          </select>
        </div>
        <div class="form-group">
          <label><i class="fab fa-youtube"></i> الفيديوهات (اختياري)</label>
          <div id="videos-container"></div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addVideoField()">+ إضافة فيديو</button>
          <small style="color: #64748b; display: block; margin-top: 0.5rem;">أضف فيديو واحد أو أكثر مع شرح منفصل لكل واحد</small>
        </div>
        <div class="form-group">
          <label><i class="fas fa-image"></i> الصور (اختياري)</label>
          <div id="images-container"></div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addImageField()">+ إضافة صورة</button>
          <small style="color: #64748b; display: block; margin-top: 0.5rem;">رفع صور من جهازك مع نص توضيحي لكل صورة</small>
        </div>
        <div style="color: #ef4444; margin: 1rem 0; padding: 0.75rem; background: #fee2e2; border-radius: 4px; display: none;" id="lesson-error">
          <i class="fas fa-exclamation-circle"></i> <span id="lesson-error-msg"></span>
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-success">حفظ الدرس</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const titleInput = document.getElementById('lesson-title');
  const errorDiv = document.getElementById('lesson-error');
  const errorMsg = document.getElementById('lesson-error-msg');

  // Real-time Arabic validation
  titleInput.addEventListener('input', (e) => {
    const arabicPattern = /^[\u0600-\u06FF\s]*$/;
    if (e.target.value && !arabicPattern.test(e.target.value)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
    } else {
      errorDiv.style.display = 'none';
    }
  });

  // Initialize with one empty video field
  window.videoFieldCount = 0;
  window.imageFieldCount = 0;
  addVideoField();

  document.getElementById('create-lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const unitId = document.getElementById('lesson-unit').value;

    if (!title) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'عنوان الدرس مطلوب';
      return;
    }
    if (!unitId) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'الوحدة الدراسية مطلوبة';
      return;
    }

    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicPattern.test(title)) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
      return;
    }

    try {
      const videos = [];
      const videoElements = document.querySelectorAll('#videos-container [data-video-index]');
      
      videoElements.forEach(el => {
        const url = el.querySelector('input[type="url"]').value;
        if (url) {
          videos.push({
            video_url: url,
            video_position: el.querySelector('select[name="position"]').value,
            video_size: 'medium',
            video_explanation: el.querySelector('textarea').value
          });
        }
      });

      const images = [];
      const imageElements = document.querySelectorAll('#images-container [data-image-index]');
      
      imageElements.forEach(el => {
        const imagePath = el.getAttribute('data-image-path');
        if (imagePath) {
          images.push({
            image_path: imagePath,
            image_position: el.querySelector('select[name="image-position"]').value,
            image_size: 'medium',
            image_caption: el.querySelector('textarea').value
          });
        }
      });

      await adminApi.post('/api/lessons', {
        title,
        unit_id: unitId,
        content: '',
        videos: videos,
        images: images
      });
      modal.remove();
      router.navigate('/admin/lessons');
      showAlert('تم إضافة الدرس بنجاح!');
    } catch (error) {
      errorDiv.style.display = 'block';
      errorMsg.textContent = error.message;
    }
  });
};

window.addVideoField = function() {
  const container = document.getElementById('videos-container');
  if (!container) return;
  
  const index = window.videoFieldCount++;
  const videoField = document.createElement('div');
  videoField.setAttribute('data-video-index', index);
  videoField.style.cssText = 'background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;';
  videoField.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <label style="font-weight: 600;">الفيديو ${index + 1}</label>
      <button type="button" class="btn btn-danger btn-xs" onclick="this.closest('[data-video-index]').remove()">حذف</button>
    </div>
    <input type="url" placeholder="https://www.youtube.com/watch?v=..." style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
    <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
      <select name="position" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
        <option value="bottom">أسفل الفيديو</option>
        <option value="top">أعلى الفيديو</option>
        <option value="side">بجانب الفيديو</option>
      </select>
    </div>
    <textarea placeholder="شرح هذا الفيديو..." style="width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; resize: vertical;"></textarea>
  `;
  container.appendChild(videoField);
};

window.addImageField = function(imagePath = '', position = 'bottom', size = 'medium', caption = '') {
  const container = document.getElementById('images-container');
  if (!container) return;
  
  const index = window.imageFieldCount++;
  const imageField = document.createElement('div');
  imageField.setAttribute('data-image-index', index);
  imageField.setAttribute('data-image-path', imagePath);
  imageField.style.cssText = 'background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;';
  imageField.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <label style="font-weight: 600;">الصورة ${index + 1}</label>
      <button type="button" class="btn btn-danger btn-xs" onclick="this.closest('[data-image-index]').remove()">حذف</button>
    </div>
    ${imagePath ? `<div style="background: white; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; border: 1px solid #e2e8f0;">
      <img src="${imagePath}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
    </div>` : ''}
    <input type="file" accept="image/*" onchange="uploadImage(this, event)" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
    <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
      <select name="image-position" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
        <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>أسفل الصورة</option>
        <option value="top" ${position === 'top' ? 'selected' : ''}>أعلى الصورة</option>
        <option value="side" ${position === 'side' ? 'selected' : ''}>بجانب الصورة</option>
      </select>
    </div>
    <textarea placeholder="نص توضيحي للصورة..." style="width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; resize: vertical;">${escapeHtml(caption)}</textarea>
  `;
  container.appendChild(imageField);
};

window.uploadImage = async function(input, event) {
  const file = input.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showAlert('الرجاء اختيار ملف صورة صحيح', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/lessons/upload-image', {
      method: 'POST',
      body: formData
    });

    const data = await safeParseJson(response);

    if (!response.ok) {
      throw new Error(data.error || 'فشل تحميل الصورة');
    }

    const imageField = input.closest('[data-image-index]');
    imageField.setAttribute('data-image-path', data.imagePath);
    
    // Add preview
    let preview = imageField.querySelector('div[style*="background: white"]');
    if (!preview) {
      preview = document.createElement('div');
      preview.style.cssText = 'background: white; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; border: 1px solid #e2e8f0;';
      input.parentNode.insertBefore(preview, input.nextSibling);
    }
    preview.innerHTML = `<img src="${data.imagePath}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">`;
    
    showAlert('تم رفع الصورة بنجاح!');
  } catch (error) {
    console.error('Image upload error:', error);
    showAlert('خطأ في رفع الصورة: ' + error.message, 'error');
  }
};

window.editLesson = async function(id) {
  try {
    console.log('editLesson called with id:', id);
    const lesson = await adminApi.get(`/api/lessons/${id}`);
    console.log('Lesson loaded:', lesson);
    
    // Make sure availableUnits is loaded, if not fetch it
    if (!window.availableUnits) {
      console.log('availableUnits not found, fetching units...');
      window.availableUnits = await adminApi.get('/api/units');
    }
    
    console.log('availableUnits:', window.availableUnits);
    
    const unitOptions = window.availableUnits.map(unit => 
      `<option value="${unit.id}" ${unit.id === lesson.unit_id ? 'selected' : ''}>${escapeHtml(unit.title || unit.title_ar)} (${escapeHtml(unit.class_name)})</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>تعديل الدرس</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <form id="edit-lesson-form">
          <div class="form-group">
            <label for="edit-lesson-title">عنوان الدرس *</label>
            <input type="text" id="edit-lesson-title" value="${escapeHtml(lesson.title || lesson.title_ar)}" required autofocus dir="rtl">
            <small style="color: #666;">يرجى إدخال عنوان الدرس بالأحرف العربية فقط</small>
          </div>
          <div class="form-group">
            <label for="edit-lesson-unit">الوحدة الدراسية *</label>
            <select id="edit-lesson-unit" required>
              ${unitOptions}
            </select>
          </div>
          <div class="form-group">
            <label><i class="fab fa-youtube"></i> الفيديوهات (اختياري)</label>
            <div id="edit-videos-container"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addEditVideoField()">+ إضافة فيديو</button>
            <small style="color: #64748b; display: block; margin-top: 0.5rem;">أضف فيديو واحد أو أكثر مع شرح منفصل لكل واحد</small>
          </div>
          <div class="form-group">
            <label><i class="fas fa-image"></i> الصور (اختياري)</label>
            <div id="edit-images-container"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addEditImageField()">+ إضافة صورة</button>
            <small style="color: #64748b; display: block; margin-top: 0.5rem;">رفع صور من جهازك مع نص توضيحي لكل صورة</small>
          </div>
          <div style="color: #ef4444; margin: 1rem 0; padding: 0.75rem; background: #fee2e2; border-radius: 4px; display: none;" id="edit-lesson-error">
            <i class="fas fa-exclamation-circle"></i> <span id="edit-lesson-error-msg"></span>
          </div>
          <div class="btn-group">
            <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const titleInput = document.getElementById('edit-lesson-title');
    const errorDiv = document.getElementById('edit-lesson-error');
    const errorMsg = document.getElementById('edit-lesson-error-msg');

    // Real-time Arabic validation
    titleInput.addEventListener('input', (e) => {
      const arabicPattern = /^[\u0600-\u06FF\s]*$/;
      if (e.target.value && !arabicPattern.test(e.target.value)) {
        errorDiv.style.display = 'block';
        errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
      } else {
        errorDiv.style.display = 'none';
      }
    });

    // Initialize videos and images
    window.editVideoFieldCount = 0;
    window.editImageFieldCount = 0;
    if (lesson.videos && lesson.videos.length > 0) {
      lesson.videos.forEach((video, idx) => {
        addEditVideoField(video.video_url, video.position, video.size, video.explanation);
      });
    } else {
      addEditVideoField();
    }

    if (lesson.images && lesson.images.length > 0) {
      lesson.images.forEach((image, idx) => {
        addEditImageField(image.image_path, image.position, image.size, image.caption);
      });
    }

    document.getElementById('edit-lesson-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const unitId = document.getElementById('edit-lesson-unit').value;

      if (!title) {
        errorDiv.style.display = 'block';
        errorMsg.textContent = 'عنوان الدرس مطلوب';
        return;
      }
      if (!unitId) {
        errorDiv.style.display = 'block';
        errorMsg.textContent = 'الوحدة الدراسية مطلوبة';
        return;
      }

      const arabicPattern = /^[\u0600-\u06FF\s]+$/;
      if (!arabicPattern.test(title)) {
        errorDiv.style.display = 'block';
        errorMsg.textContent = 'يجب أن يحتوي على أحرف عربية فقط';
        return;
      }

      try {
        const videos = [];
        const videoElements = document.querySelectorAll('#edit-videos-container [data-video-index]');
        
        videoElements.forEach(el => {
          const url = el.querySelector('input[type="url"]').value;
          if (url) {
            videos.push({
              video_url: url,
              video_position: el.querySelector('select[name="position"]').value,
              video_size: 'medium',
              video_explanation: el.querySelector('textarea').value
            });
          }
        });

        const images = [];
        const imageElements = document.querySelectorAll('#edit-images-container [data-image-index]');
        
        imageElements.forEach(el => {
          const imagePath = el.getAttribute('data-image-path');
          if (imagePath) {
            images.push({
              image_path: imagePath,
              image_position: el.querySelector('select[name="image-position"]').value,
              image_size: 'medium',
              image_caption: el.querySelector('textarea').value
            });
          }
        });

        await adminApi.put(`/api/lessons/${id}`, {
          title,
          unit_id: unitId,
          content: '',
          videos: videos,
          images: images
        });
        modal.remove();
        router.navigate('/admin/lessons');
        showAlert('تم تحديث الدرس بنجاح!');
      } catch (error) {
        errorDiv.style.display = 'block';
        errorMsg.textContent = error.message;
      }
    });
  } catch (error) {
    console.error('editLesson error:', error);
    showAlert('خطأ في تحميل الدرس: ' + error.message, 'error');
  }
};

window.deleteLesson = async function(id, title) {
  const confirmed = await showConfirmModal(
    'حذف الدرس',
    `<p>هل أنت متأكد من حذف "<strong>${escapeHtml(title)}</strong>"؟</p><p style="color: #ef4444; margin-top: 0.5rem; font-size: 0.9rem;"><i class="fas fa-exclamation-triangle"></i> لا يمكن التراجع عن هذا الإجراء.</p>`
  );
  
  if (!confirmed) return;
  
  try {
    await adminApi.delete(`/api/lessons/${id}`);
    router.navigate('/admin/lessons');
    showAlert('تم حذف الدرس بنجاح!');
  } catch (error) {
    showAlert(error.message, 'error');
  }
};

// Handle navigation
window.addEventListener('popstate', () => {
  router.handleRoute();
});

// Initial route - wait for DOM to be ready
if (document.readyState === 'loading') {
  console.log('Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, handling route...');
    router.handleRoute();
  });
} else {
  console.log('DOM already ready, handling route...');
  router.handleRoute();
}

window.addEditVideoField = function(url = '', position = 'bottom', size = 'medium', explanation = '') {
  const container = document.getElementById('edit-videos-container');
  if (!container) return;
  
  const index = window.editVideoFieldCount++;
  const videoField = document.createElement('div');
  videoField.setAttribute('data-video-index', index);
  videoField.style.cssText = 'background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;';
  videoField.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <label style="font-weight: 600;">الفيديو ${index + 1}</label>
      <button type="button" class="btn btn-danger btn-xs" onclick="this.closest('[data-video-index]').remove()">حذف</button>
    </div>
    <input type="url" value="${escapeHtml(url)}" placeholder="https://www.youtube.com/watch?v=..." style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
    <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
      <select name="position" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
        <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>أسفل الفيديو</option>
        <option value="top" ${position === 'top' ? 'selected' : ''}>أعلى الفيديو</option>
        <option value="side" ${position === 'side' ? 'selected' : ''}>بجانب الفيديو</option>
      </select>
    </div>
    <textarea placeholder="شرح هذا الفيديو..." style="width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; resize: vertical;">${escapeHtml(explanation)}</textarea>
  `;
  container.appendChild(videoField);
};

window.addEditImageField = function(imagePath = '', position = 'bottom', size = 'medium', caption = '') {
  const container = document.getElementById('edit-images-container');
  if (!container) return;
  
  const index = window.editImageFieldCount++;
  const imageField = document.createElement('div');
  imageField.setAttribute('data-image-index', index);
  imageField.setAttribute('data-image-path', imagePath);
  imageField.style.cssText = 'background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0;';
  imageField.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
      <label style="font-weight: 600;">الصورة ${index + 1}</label>
      <button type="button" class="btn btn-danger btn-xs" onclick="this.closest('[data-image-index]').remove()">حذف</button>
    </div>
    ${imagePath ? `<div style="background: white; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; border: 1px solid #e2e8f0;">
      <img src="${imagePath}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
    </div>` : ''}
    <input type="file" accept="image/*" onchange="uploadEditImage(this, event)" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
    <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
      <select name="image-position" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;">
        <option value="bottom" ${position === 'bottom' ? 'selected' : ''}>أسفل الصورة</option>
        <option value="top" ${position === 'top' ? 'selected' : ''}>أعلى الصورة</option>
        <option value="side" ${position === 'side' ? 'selected' : ''}>بجانب الصورة</option>
      </select>
    </div>
    <textarea placeholder="نص توضيحي للصورة..." style="width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; min-height: 60px; resize: vertical;">${escapeHtml(caption)}</textarea>
  `;
  container.appendChild(imageField);
};

window.uploadEditImage = async function(input, event) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/lessons/upload-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await safeParseJson(response);
    const imageField = input.closest('[data-image-index]');
    imageField.setAttribute('data-image-path', data.imagePath);
    
    // Add preview
    let preview = imageField.querySelector('div[style*="background: white"]');
    if (!preview) {
      preview = document.createElement('div');
      preview.style.cssText = 'background: white; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem; border: 1px solid #e2e8f0;';
      input.parentNode.insertBefore(preview, input.nextSibling);
    }
    preview.innerHTML = `<img src="${data.imagePath}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">`;
    
    showAlert('تم رفع الصورة بنجاح!');
  } catch (error) {
    showAlert('خطأ في رفع الصورة: ' + error.message, 'error');
  }
};

