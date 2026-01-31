# Production Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites
- [ ] Changed `JWT_SECRET` in `.env.production`
- [ ] Changed `ADMIN_PASSWORD` in `.env.production`
- [ ] Tested locally and passed Step 1 security checks

---

## Option A: Backend on Render.com + Frontend on Cloudflare Pages

### 1️⃣ Deploy Backend to Render

1. **Create Render account**: https://render.com
2. **Create New Web Service**:
   - Connect your GitHub repository
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node

3. **Add Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=[Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=[Your strong password]
   JWT_EXPIRY=7d
   FRONTEND_URL=https://your-site.pages.dev
   ```

4. **Important Settings**:
   - Auto-Deploy: Yes
   - Health Check Path: `/api/classes` (should return 200)
   - Plan: Free (upgradeable)

5. **Get your backend URL**: `https://your-app.onrender.com`

### 2️⃣ Deploy Frontend to Cloudflare Pages

1. **Update `public/config.js`**:
   ```javascript
   const config = {
     API_BASE_URL: 'https://your-app.onrender.com'
   };
   ```

2. **Create Cloudflare Pages project**:
   - Connect GitHub repository
   - **Build command**: Leave empty (static files only)
   - **Build output directory**: `public`
   - **Root directory**: `/`

3. **Deploy**

4. **Get your frontend URL**: `https://your-site.pages.dev`

5. **Update Render environment variable**:
   - Go back to Render
   - Set `FRONTEND_URL=https://your-site.pages.dev`
   - Redeploy backend

---

## Option B: Backend on Railway.app + Frontend on Netlify

### 1️⃣ Deploy Backend to Railway

1. **Create Railway account**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Add Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=[64 char hex]
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=[Strong password]
   JWT_EXPIRY=7d
   FRONTEND_URL=https://your-app.netlify.app
   ```

4. **Railway will auto-detect Node.js** and deploy

5. **Get your backend URL**: `https://your-app.up.railway.app`

### 2️⃣ Deploy Frontend to Netlify

1. **Update `public/config.js`**:
   ```javascript
   const config = {
     API_BASE_URL: 'https://your-app.up.railway.app'
   };
   ```

2. **Create Netlify site**:
   - Connect GitHub repository
   - **Build command**: Leave empty
   - **Publish directory**: `public`

3. **Deploy**

4. **Get your frontend URL**: `https://your-app.netlify.app`

5. **Update Railway environment**:
   - Set `FRONTEND_URL=https://your-app.netlify.app`
   - Redeploy

---

## Option C: All-in-One Deployment (Single Server)

If you want to keep frontend and backend together:

### Deploy to Render (Easiest)

1. **Create Web Service** on Render
2. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=[64 char hex]
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=[Strong password]
   JWT_EXPIRY=7d
   ```
   (No FRONTEND_URL needed - same domain)

3. **Deploy** - Frontend will be served from `/public`

4. **Your site**: `https://your-app.onrender.com`
   - Public site: `https://your-app.onrender.com`
   - Admin: `https://your-app.onrender.com/admin/login`

---

## 🔒 Security Checklist After Deployment

- [ ] Test admin routes without auth → Should return 401
- [ ] Test admin login → Should work
- [ ] View page source → No secrets visible
- [ ] Check browser DevTools Network tab → Auth uses httpOnly cookies
- [ ] Try to edit lesson from DevTools console → Should fail
- [ ] Test on mobile device
- [ ] Logout → Session should end

---

## 🗄️ Database Backups

### Render/Railway (PostgreSQL/MySQL)
- Enable automatic backups in dashboard
- Download backup weekly

### SQLite on Render
⚠️ **Important**: Free tier Render uses ephemeral storage. Your database will reset on deploy!

**Solutions**:
1. Upgrade to persistent disk ($7/month)
2. Use external PostgreSQL (Supabase free tier)
3. Manual backup/restore via admin panel

---

## 📊 Monitoring

### Check these regularly:
- [ ] Backend health endpoint: `GET /api/classes`
- [ ] Admin login working
- [ ] New content appears immediately
- [ ] No 500 errors in logs

---

## 🆘 Troubleshooting

### "Network Error" on frontend
- Check CORS settings in backend
- Verify `FRONTEND_URL` matches your frontend domain
- Check browser console for CORS errors

### Admin login fails
- Verify environment variables are set correctly
- Check backend logs for authentication errors
- Ensure `JWT_SECRET` is the same across deploys

### Database resets on deploy (Render)
- Upgrade to persistent disk
- Or migrate to managed PostgreSQL

### 500 errors
- Check backend logs in hosting dashboard
- Verify all required packages are in `package.json`
- Check database connection

---

## 🎯 Next Steps After Successful Deployment

1. ✅ Test all security checks (Step 6)
2. ✅ Admin creates real content (Step 7)
3. ✅ Setup backup strategy (Step 8)
4. ✅ Final acceptance testing (Step 9)
