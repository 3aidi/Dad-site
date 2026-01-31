# Educational Content System

A secure, production-ready educational content management system designed for teachers to present teaching materials in a clear hierarchical structure.

## 📋 Overview

This system provides a public-facing educational website with a private admin dashboard for content management. The content is organized in a strict three-level hierarchy:

**Class → Unit → Lesson → Lesson Content**

### Key Features

- ✅ **Public Read-Only Access**: Anyone can browse classes, units, and lessons
- 🔐 **Secure Admin Dashboard**: Single authenticated admin with full CRUD permissions
- 🎯 **Strict Hierarchy**: Enforced data structure with proper relationships
- 🔒 **Production Security**: Server-side authentication with JWT and httpOnly cookies
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast & Lightweight**: Vanilla JavaScript, no frameworks

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **JWT** authentication with httpOnly cookies
- **bcrypt** for password hashing

### Frontend
- **HTML5** & **CSS3**
- **Vanilla JavaScript** (no frameworks)
- Client-side routing for SPA experience

## 📁 Project Structure

```
educational-content-system/
├── public/                  # Frontend files
│   ├── index.html          # Public site
│   ├── app.js              # Public site logic
│   ├── styles.css          # Public styles
│   ├── admin.html          # Admin panel
│   ├── admin.js            # Admin panel logic
│   └── admin-styles.css    # Admin styles
├── src/
│   ├── database/
│   │   ├── database.js     # Database connection
│   │   └── initDatabase.js # Database initialization
│   ├── middleware/
│   │   └── auth.js         # Authentication middleware
│   └── routes/
│       ├── authRoutes.js   # Authentication endpoints
│       ├── classRoutes.js  # Class CRUD endpoints
│       ├── unitRoutes.js   # Unit CRUD endpoints
│       └── lessonRoutes.js # Lesson CRUD endpoints
├── server.js               # Express server
├── package.json            # Dependencies
├── .env.example            # Environment variables template
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and npm installed
- Basic understanding of command line

### Installation

1. **Navigate to the project directory**:
   ```powershell
   cd c:\educational-content-system
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Create environment file**:
   ```powershell
   Copy-Item .env.example .env
   ```

4. **Edit `.env` file** and set your configuration:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourSecurePassword123!
   ```

   ⚠️ **IMPORTANT**: Change the JWT_SECRET and ADMIN_PASSWORD to strong, unique values!

5. **Initialize the database**:
   ```powershell
   npm run init-db
   ```

6. **Start the server**:
   ```powershell
   npm start
   ```

7. **Access the application**:
   - Public Site: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin/login

## 🔐 Security Features

### Implemented Security Measures

1. **Server-Side Authentication**
   - All admin routes protected by JWT middleware
   - No authentication logic in frontend JavaScript
   - httpOnly cookies prevent XSS attacks

2. **Password Security**
   - Passwords hashed with bcrypt (10 rounds)
   - Never stored in plain text
   - Not exposed in frontend code

3. **Authorization**
   - Admin endpoints verify token before execution
   - Public users cannot access admin APIs
   - Foreign key constraints in database

4. **Input Validation**
   - Required fields validated on server
   - SQL injection prevented by parameterized queries
   - XSS prevention through proper HTML escaping

5. **Session Management**
   - JWT tokens with expiration
   - Secure cookie settings (httpOnly, sameSite)
   - Logout properly clears authentication

## 📊 Database Schema

```sql
-- Admin Table
admins (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at DATETIME
)

-- Classes Table
classes (
  id INTEGER PRIMARY KEY,
  name TEXT,
  created_at DATETIME
)

-- Units Table
units (
  id INTEGER PRIMARY KEY,
  class_id INTEGER,          -- Foreign Key to classes
  title TEXT,
  created_at DATETIME,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
)

-- Lessons Table
lessons (
  id INTEGER PRIMARY KEY,
  unit_id INTEGER,           -- Foreign Key to units
  title TEXT,
  content TEXT,
  created_at DATETIME,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify authentication status

### Classes (Public & Admin)
- `GET /api/classes` - Get all classes (public)
- `GET /api/classes/:id` - Get single class (public)
- `POST /api/classes` - Create class (admin only)
- `PUT /api/classes/:id` - Update class (admin only)
- `DELETE /api/classes/:id` - Delete class (admin only)

### Units (Public & Admin)
- `GET /api/units/class/:classId` - Get units by class (public)
- `GET /api/units/:id` - Get single unit (public)
- `GET /api/units` - Get all units with relations (admin only)
- `POST /api/units` - Create unit (admin only)
- `PUT /api/units/:id` - Update unit (admin only)
- `DELETE /api/units/:id` - Delete unit (admin only)

### Lessons (Public & Admin)
- `GET /api/lessons/unit/:unitId` - Get lessons by unit (public)
- `GET /api/lessons/:id` - Get single lesson (public)
- `GET /api/lessons` - Get all lessons with relations (admin only)
- `POST /api/lessons` - Create lesson (admin only)
- `PUT /api/lessons/:id` - Update lesson (admin only)
- `DELETE /api/lessons/:id` - Delete lesson (admin only)

## 👥 User Roles

### Viewer (Public User)
- No login required
- Can view classes, units, and lessons
- Read-only access
- Cannot modify any data

### Admin (Teacher)
- Login required
- Full CRUD permissions
- Manage all content
- Access to admin dashboard

## 🎨 Admin Dashboard Features

### Dashboard
- Content overview statistics
- Quick action buttons
- Summary of classes, units, and lessons

### Classes Management
- View all classes in a table
- Create new classes
- Edit existing classes
- Delete classes (cascades to units and lessons)

### Units Management
- View all units with their classes
- Create units with class selection
- Edit unit details
- Delete units (cascades to lessons)

### Lessons Management
- View all lessons with unit and class info
- Create lessons with unit selection
- Edit lesson title, content, and unit
- Delete individual lessons

## 🔄 Content Workflow

1. **Create a Class** (e.g., "Mathematics")
2. **Add Units to the Class** (e.g., "Algebra", "Geometry")
3. **Add Lessons to Units** (e.g., "Linear Equations", "Quadratic Functions")
4. **Write Lesson Content** using the text editor

## 🌐 Public Routes

- `/` - Home page
- `/classes` - List all classes
- `/class/:classId` - View units in a class
- `/unit/:unitId` - View lessons in a unit
- `/lesson/:lessonId` - View lesson content

## 🔒 Admin Routes

- `/admin/login` - Login page
- `/admin/dashboard` - Dashboard overview
- `/admin/classes` - Manage classes
- `/admin/units` - Manage units
- `/admin/lessons` - Manage lessons

## 🚢 Deployment

### Quick Deployment

For detailed production deployment instructions, see:
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Complete pre-deployment checklist
- **[PRODUCTION-DEPLOY.md](PRODUCTION-DEPLOY.md)** - Step-by-step deployment guides

### Generate Production Secrets

```bash
npm run generate-secrets
```

### Production Checklist

- [ ] Change `JWT_SECRET` to generated 64-char hex string
- [ ] Change default admin password to strong password
- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` for CORS (if frontend/backend separated)
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Test all security requirements

### Recommended Hosting

**Backend Options**:
- Render.com (free tier available)
- Railway.app (free tier available)
- Fly.io

**Frontend Options** (if separated):
- Cloudflare Pages (free)
- Netlify (free tier)
- Vercel (free tier)

**All-in-One Option**:
- Deploy both frontend and backend to Render.com (simplest)

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=[Use npm run generate-secrets]
ADMIN_USERNAME=admin
ADMIN_PASSWORD=[Strong password 20+ chars]
JWT_EXPIRY=7d
FRONTEND_URL=https://your-frontend-domain.com
```

### SSL/HTTPS Setup

For production, you MUST use HTTPS. The httpOnly cookie security depends on it.

- Use Let's Encrypt for free SSL certificates
- Configure Nginx or Apache as reverse proxy
- Ensure `secure: true` in cookie options when in production

## 🧪 Testing the Application

### Test Public Access

1. Open http://localhost:3000
2. Click "Browse Classes"
3. Navigate through Class → Unit → Lesson hierarchy
4. Verify you can only read content

### Test Admin Access

1. Open http://localhost:3000/admin/login
2. Login with credentials from `.env`
3. Test creating a class
4. Test creating a unit under that class
5. Test creating a lesson under that unit
6. Test editing and deleting content
7. Test logout functionality

### Security Testing

1. Try accessing `/admin/dashboard` without logging in
2. Try calling admin API endpoints without authentication
3. Verify admin routes redirect to login when not authenticated
4. Check that httpOnly cookies are set correctly in DevTools

## 📝 Common Tasks

### Change Admin Password

1. Hash a new password using bcrypt
2. Update the database directly:
   ```sql
   UPDATE admins SET password_hash = 'new_hashed_password' WHERE username = 'admin';
   ```
3. Or delete the database and run `npm run init-db` with new credentials in `.env`

### Backup Database

```powershell
Copy-Item database.db database.backup.db
```

### Reset Database

```powershell
Remove-Item database.db
npm run init-db
```

## 🐛 Troubleshooting

### "EADDRINUSE" Error
Port 3000 is already in use. Change `PORT` in `.env` or stop the other process.

### Cannot Login to Admin
- Verify credentials in `.env` match what you're entering
- Check if database was initialized correctly
- Run `npm run init-db` again if needed

### "Authentication required" on Admin Pages
- Clear your cookies
- Login again at `/admin/login`
- Check browser console for errors

### Database Errors
- Ensure database.db file exists
- Check file permissions
- Run `npm run init-db` to recreate database

## 📚 Additional Notes

### Why SQLite?
- Simple setup (no separate database server)
- Perfect for small to medium sites
- Can migrate to PostgreSQL/MySQL later if needed

### Why Vanilla JavaScript?
- No build process required
- Faster load times
- Easier to understand and modify
- No framework lock-in

### Why httpOnly Cookies?
- Prevents XSS attacks from stealing tokens
- Browser automatically sends with requests
- More secure than localStorage

## 🤝 Contributing

This is a production-ready template. Feel free to extend it with:
- Rich text editor for lesson content
- Image uploads
- Video embeds
- Search functionality
- Student accounts (if requirements change)
- Export/import functionality

## 📄 License

MIT License - Use freely for educational purposes

## 🆘 Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Check console errors
4. Verify environment configuration

---

**Built with security and simplicity in mind** 🔐✨
