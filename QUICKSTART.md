# Quick Start Guide

Get your Educational Content System running in 5 minutes!

## Step 1: Install Dependencies

```powershell
cd c:\educational-content-system
npm install
```

## Step 2: Configure Environment

```powershell
Copy-Item .env.example .env
```

Open `.env` and change these values:

```env
JWT_SECRET=MySecretKey123456789CHANGETHIS
ADMIN_PASSWORD=MyStrongPassword123!
```

## Step 3: Initialize Database

```powershell
npm run init-db
```

You should see:
```
✓ Admin table created
✓ Classes table created
✓ Units table created
✓ Lessons table created
✓ Default admin account created
  Username: admin
  Password: MyStrongPassword123!
```

## Step 4: Start Server

```powershell
npm start
```

You should see:
```
Connected to SQLite database
Server running on http://localhost:3000
Admin panel: http://localhost:3000/admin/login
```

## Step 5: Test the System

### Test Public Site
1. Open: http://localhost:3000
2. You should see the home page
3. Click "Browse Classes" (will be empty initially)

### Test Admin Panel
1. Open: http://localhost:3000/admin/login
2. Login with:
   - Username: `admin`
   - Password: (what you set in .env)
3. You should see the dashboard

### Create Sample Content
1. Click "Classes" in the sidebar
2. Click "+ New Class"
3. Enter "Introduction to Programming"
4. Click "Units" in the sidebar
5. Click "+ New Unit"
6. Enter "Variables and Data Types", select the class
7. Click "Lessons" in the sidebar
8. Click "+ New Lesson"
9. Enter "What is a Variable?", select the unit
10. Add some content and save

### View as Public User
1. Open: http://localhost:3000/classes (in a new tab or incognito window)
2. You should see your class
3. Click through to see your unit and lesson

## Done! 🎉

Your educational content system is now running and ready to use.

## Next Steps

- Add more classes, units, and lessons
- Customize the styling in `public/styles.css`
- Change the site title in `public/index.html`
- Deploy to production (see README.md for deployment guide)

## Quick Commands Reference

```powershell
# Start the server
npm start

# Initialize/reset database
npm run init-db

# Backup database
Copy-Item database.db database.backup.db

# Restore database
Copy-Item database.backup.db database.db
```

## Troubleshooting

**Can't connect to server?**
- Make sure you ran `npm install`
- Check if port 3000 is available
- Look for errors in the terminal

**Can't login to admin?**
- Double-check password in `.env` file
- Make sure you ran `npm run init-db`
- Try resetting the database

**See "Loading..." forever?**
- Check browser console for errors (F12)
- Verify the server is running
- Check if API requests are reaching the server

## Need Help?

Check the full README.md for detailed documentation.
