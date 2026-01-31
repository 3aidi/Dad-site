# Pre-Deployment Checklist

Complete this checklist BEFORE deploying to production.

## ✅ Step 1: Local Security Verification (COMPLETED ✓)

- [x] Admin routes return 401 without authentication
- [x] Public routes work without authentication
- [x] Database persistence verified
- [x] .env in .gitignore
- [x] No hardcoded secrets in code

## 🔒 Step 2: Production Security Preparation

### A. Generate Production Secrets

```bash
npm run generate-secrets
```

Copy the generated values and:

- [ ] Update `.env.production` with new JWT_SECRET
- [ ] Create strong ADMIN_PASSWORD (different from dev)
- [ ] Store secrets in password manager
- [ ] **NEVER commit .env.production to Git**

### B. Verify Security Files

- [x] `.env` in .gitignore
- [x] `.env.production` in .gitignore
- [x] No API keys in public/ folder
- [x] No passwords in source code

### C. Frontend Configuration

- [x] `public/config.js` created
- [ ] Update API_BASE_URL for production (after backend is deployed)

## 🚀 Step 3: Choose Hosting Platform

Choose ONE option:

### Option A: Separated (Recommended)
- [ ] **Backend**: Render.com (or Railway.app)
- [ ] **Frontend**: Cloudflare Pages (or Netlify)
- See [PRODUCTION-DEPLOY.md](PRODUCTION-DEPLOY.md) for steps

### Option B: All-in-One
- [ ] **Both**: Render.com or Railway.app
- See [PRODUCTION-DEPLOY.md](PRODUCTION-DEPLOY.md) for steps

## 📝 Step 4: Deploy Backend

- [ ] Create hosting account
- [ ] Connect GitHub repository
- [ ] Set all environment variables:
  - NODE_ENV=production
  - JWT_SECRET=[from generate-secrets]
  - ADMIN_USERNAME=admin
  - ADMIN_PASSWORD=[strong password]
  - JWT_EXPIRY=7d
  - FRONTEND_URL=[your frontend domain, if separated]
- [ ] Deploy backend
- [ ] Get backend URL: `https://____________`
- [ ] Test: `curl https://your-backend/api/classes`
- [ ] Should return JSON (not error)

## 🎨 Step 5: Deploy Frontend

- [ ] Update `public/config.js` with backend URL
- [ ] Commit and push changes
- [ ] Create hosting account
- [ ] Connect GitHub repository
- [ ] Set build directory: `public`
- [ ] Deploy frontend
- [ ] Get frontend URL: `https://____________`
- [ ] Update backend FRONTEND_URL environment variable
- [ ] Redeploy backend

## 🔐 Step 6: Production Security Checks

Test your production site:

- [ ] **View page source** → No secrets visible
- [ ] **Try to call admin API without auth**:
  ```bash
  curl -X POST https://your-backend/api/classes \
    -H "Content-Type: application/json" \
    -d '{"name":"Hack"}'
  ```
  Should return: `{"error":"Authentication required"}`

- [ ] **Open DevTools Console**:
  ```javascript
  fetch('/api/classes', {method: 'POST', body: JSON.stringify({name: 'Hack'})})
  ```
  Should return 401 error

- [ ] **Admin login** works
- [ ] **Create test content** as admin
- [ ] **View test content** as public user
- [ ] **Logout** → Session ends
- [ ] **Try to access admin after logout** → Redirects to login
- [ ] **Test on mobile device**

## 🗄️ Step 7: Database Backup Strategy

Choose ONE:

### For SQLite on Render/Railway:
- [ ] **Option A**: Upgrade to persistent disk ($7/month)
- [ ] **Option B**: Migrate to PostgreSQL (Supabase free tier)
- [ ] **Option C**: Manual weekly backup via download

### For managed databases:
- [ ] Enable automatic backups in dashboard
- [ ] Test restore procedure

## 📊 Step 8: Monitoring Setup

- [ ] Bookmark backend health check: `/api/classes`
- [ ] Bookmark frontend admin login
- [ ] Add uptime monitoring (optional): UptimeRobot
- [ ] Check logs for errors

## 🎓 Step 9: Content Onboarding

Now the admin can:

- [ ] Login to production admin panel
- [ ] Create real classes
- [ ] Create real units
- [ ] Create real lessons with content
- [ ] Test content on public site
- [ ] Test on mobile device
- [ ] Verify RTL text (if using Arabic)

## ✅ Step 10: Final Acceptance

Project is COMPLETE when:

- [ ] Public users can browse all content
- [ ] Admin can manage all content
- [ ] No security vulnerabilities
- [ ] Works on desktop and mobile
- [ ] Database backups enabled
- [ ] Admin credentials stored securely
- [ ] System is stable for 24 hours

---

## 🎉 After Completion

Only AFTER all above steps:

- [ ] Consider adding PDF support
- [ ] Consider adding video embedding
- [ ] Consider adding search
- [ ] Consider SEO optimization
- [ ] Consider analytics

---

## 🆘 Common Issues

### "CORS error" in browser console
- Update FRONTEND_URL in backend environment variables
- Redeploy backend

### "Database file not found" after deploy
- Backend using ephemeral storage
- Upgrade to persistent disk or migrate to PostgreSQL

### Admin login fails
- Check JWT_SECRET is set correctly
- Check ADMIN_PASSWORD matches database
- Clear browser cookies and try again

### Content not showing
- Check backend logs for errors
- Verify database has data: `/api/classes` should return JSON
- Check frontend API_BASE_URL in config.js

---

## 📞 Support

If deployment fails:
1. Check hosting platform logs
2. Verify all environment variables
3. Test backend health endpoint
4. Check browser console for errors
5. Review [PRODUCTION-DEPLOY.md](PRODUCTION-DEPLOY.md)
