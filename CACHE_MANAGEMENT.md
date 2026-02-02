# Cache Management Guide

## How Cache-Busting Works

This application uses **version-based cache-busting** to ensure users always get the latest static assets (CSS, JS) without requiring hard refreshes.

## Cache Strategy

### ✅ Static Assets (CSS, JS, Fonts, Images)
- **Cached for**: 7 days in production
- **Cache-busting method**: Version query parameters (e.g., `styles.css?v=1.0.0`)
- **Result**: Long-term caching for performance, but updates are instant when version changes

### ✅ HTML Files
- **Cached for**: Never (no-cache)
- **Result**: Always fetches fresh HTML, which loads the versioned static assets

## How to Deploy Updates

### When you make changes to CSS, JS, or other static files:

1. **Update the version number** in `/public/version.js`:
   ```javascript
   window.APP_VERSION = '1.0.1'; // Increment this
   ```

2. **Update version in HTML files** (4 places):
   - `/public/index.html`: Update all `?v=X.X.X` to match
   - `/public/admin.html`: Update all `?v=X.X.X` to match

3. **Deploy**: Push changes and restart server

### Version Numbering Convention

Use semantic versioning (MAJOR.MINOR.PATCH):
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, small CSS tweaks
- **MINOR** (1.0.0 → 1.1.0): New features, significant updates
- **MAJOR** (1.0.0 → 2.0.0): Major redesigns, breaking changes

## Files Updated for Cache Management

### Created:
- ✅ `/public/version.js` - Version constant

### Modified:
- ✅ `/public/index.html` - Added meta tags + versioned asset links
- ✅ `/public/admin.html` - Added meta tags + versioned asset links
- ✅ `/server.js` - Cache-control middleware

## Testing

### Test that updates work:
1. Make a visible change to CSS (e.g., change a color)
2. Update version number (e.g., `1.0.0` → `1.0.1`)
3. Deploy
4. Reload page normally (NO hard refresh)
5. ✅ Change should appear immediately

### Test on mobile/iPhone:
1. Open Safari on iPhone
2. Load the site
3. Deploy an update with new version
4. Simply reload the page (pull down to refresh)
5. ✅ Updates should appear

## Current Version

**Current Version**: `1.0.0`

Update this document when you change the version!

---

## Quick Commands

```bash
# Find all version references
grep -r "v=1.0.0" public/

# Update version in all HTML files (Linux/Mac)
sed -i 's/v=1.0.0/v=1.0.1/g' public/*.html

# Update version in all HTML files (Windows PowerShell)
(Get-Content public/index.html) -replace 'v=1.0.0', 'v=1.0.1' | Set-Content public/index.html
(Get-Content public/admin.html) -replace 'v=1.0.0', 'v=1.0.1' | Set-Content public/admin.html
```

## Browser Compatibility

✅ **Desktop**: Chrome, Firefox, Safari, Edge  
✅ **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet  
✅ **Works without**: Hard refresh, cache clearing, or special user action
