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
        throw new Error('فشل تحميل البيانات');
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الاتصال');
      }
      throw error;
    }
  }
};

// Initialize router
const router = new Router();
const app = document.getElementById('app');

// Home Page
router.on('/', async () => {
  app.innerHTML = `
    <h1 class="page-title">مرحبًا بكم أعزائي الطلاب</h1>
    <p class="page-subtitle">هنا ستجدون جميع الدروس والمحتوى التعليمي المنظم حسب الصفوف والوحدات لمساعدتكم في دراستكم</p>
    
    <div class="cards-grid">
      <div class="card" onclick="router.navigate('/classes')">
        <h3>الصفوف الدراسية</h3>
        <p>استكشفوا جميع الصفوف الدراسية المتاحة ومحتوياتها التعليمية المتميزة</p>
      </div>
      <div class="card" style="cursor: default; opacity: 0.7;">
        <h3>حول المنصة</h3>
        <p>منصة لعرض أعمالي التعليمية ومساعدة طلابي في المدرسة</p>
      </div>
    </div>
  `;
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
    
    const lessonHTML = `${videosSections}${imagesSections}${content ? `<div class="lesson-content">${content}</div>` : ''}`;

    app.innerHTML = `
      ${breadcrumbs}
      <h1 class="page-title">${escapeHtml(lesson.title)}</h1>
      ${lessonHTML}
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
