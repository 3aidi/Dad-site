# CSS Variables Reference Guide

## Overview
All colors, shadows, gradients, and animations are defined as CSS variables in `shared-styles.css`. This ensures consistency across both Admin and Student views.

---

## Color Variables

### Primary Colors (Brand)
```css
--primary-color: #1e3a8a;           /* Main brand - deep blue */
--primary-dark: #1e40af;            /* Darker shade - hover states */
--primary-light: #2563eb;           /* Lighter shade - buttons */
```
**Usage**: Main navigation, headers, primary buttons

### Secondary Colors
```css
--secondary-color: #0891b2;         /* Cyan accent */
--accent-gold: #d4af37;             /* Special highlights, premium feel */
```
**Usage**: Links, card accents, special elements

### Status Colors
```css
--success-color: #059669;           /* Success messages, green */
--success-hover: #16a34a;           /* Darker green on hover */
--danger-color: #dc2626;            /* Errors, red */
--danger-light: #ef4444;            /* Light red for backgrounds */
--warning-color: #f59e0b;           /* Warnings, amber */
--info-color: #0ea5e9;              /* Info, cyan */
--info-dark: #0284c7;               /* Darker info */
```
**Usage**: Alert boxes, status indicators, button states

### Neutral Colors
```css
--text-color: #1e293b;              /* Main text - dark slate */
--light-text: #64748b;              /* Secondary text - gray */
--light-bg: #f8fafc;                /* Light backgrounds */
--card-bg: #ffffff;                 /* Card background - white */
--border-color: #e2e8f0;            /* Borders - light gray */
--hover-bg: #f1f5f9;                /* Hover backgrounds */
```
**Usage**: Text, backgrounds, borders, general UI

---

## Shadow Variables

```css
--shadow: 0 2px 8px rgba(30, 58, 138, 0.08);
```
**Use**: Cards, small elements, subtle depth
**Example**: `box-shadow: var(--shadow);`

```css
--shadow-lg: 0 10px 40px rgba(30, 58, 138, 0.12);
```
**Use**: Hovered cards, modal backgrounds
**Example**: `box-shadow: var(--shadow-lg);`

```css
--shadow-xl: 0 20px 60px rgba(30, 58, 138, 0.15);
```
**Use**: Prominent overlays, maximum emphasis
**Example**: `box-shadow: var(--shadow-xl);`

---

## Gradient Variables

### Primary Gradient (Blue to Cyan)
```css
--gradient-primary: linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%);
```
**Use**: Headers, major buttons, hero sections
**Example**: `background: var(--gradient-primary);`

### Gold Gradient
```css
--gradient-gold: linear-gradient(135deg, #d4af37 0%, #f59e0b 100%);
```
**Use**: Accents, premium features, special highlights
**Example**: `background: var(--gradient-gold);`

### Blue Gradient
```css
--gradient-blue: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
```
**Use**: Primary buttons, action elements
**Example**: `background: var(--gradient-blue);`

### Danger Gradient
```css
--gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```
**Use**: Delete buttons, error states, critical actions
**Example**: `background: var(--gradient-danger);`

### Info Gradient
```css
--gradient-info: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
```
**Use**: Info buttons, questions feature
**Example**: `background: var(--gradient-info);`

### Success Gradient
```css
--gradient-success: linear-gradient(135deg, #059669 0%, #10b981 100%);
```
**Use**: Success buttons, positive actions
**Example**: `background: var(--gradient-success);`

---

## Transition/Animation Variables

### Duration Variables
```css
--transition-fast: 0.2s;            /* Quick feedback - hover effects */
--transition-normal: 0.3s;          /* Standard - modals, cards appear */
--transition-slow: 0.5s;            /* Gradual - shimmer effects */
```

### Easing Function
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```
**Characteristics**: Professional, smooth, natural feeling
**Use**: All interactive elements
**Example**: `transition: all var(--transition-normal) var(--ease-smooth);`

### Common Animations
```css
@keyframes fadeIn { }        /* Opacity: 0 → 1 */
@keyframes slideUp { }       /* Y: 20px → 0 */
@keyframes slideDown { }     /* Y: -20px → 0 */
@keyframes spin { }          /* Rotate: 0deg → 360deg */
@keyframes pulse { }         /* Opacity: 1 → 0.5 → 1 */
@keyframes slideIn { }       /* Y: -10px → 0 */
```

---

## Quick Reference by Component

### Buttons
```css
/* All buttons start with base */
.btn {
  transition: all var(--transition-fast) ease;
}

/* Button type specific */
.btn-primary {
  background: var(--gradient-blue);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:hover {
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
  transform: translateY(-2px);
}
```

### Cards
```css
.card {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow);
  transition: all var(--transition-normal) var(--ease-smooth);
}

.card:hover {
  box-shadow: var(--shadow-xl);
  border-color: var(--accent-gold);
}
```

### Forms
```css
.form-group input {
  border: 2px solid var(--border-color);
  color: var(--text-color);
  transition: all var(--transition-normal) ease;
}

.form-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}
```

### Alerts
```css
.alert {
  animation: slideIn var(--transition-normal) ease;
}

.alert-success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #7f1d1d;
  border: 1px solid #fca5a5;
}
```

### Tables
```css
table th {
  background: var(--light-bg);
  color: var(--primary-color);
  font-weight: 600;
}

table tr:hover {
  background: var(--light-bg);
  transition: background var(--transition-fast) ease;
}
```

---

## How to Use Variables Correctly

### ✅ CORRECT - Always use variables
```css
.my-button {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal) var(--ease-smooth);
}

.my-button:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}
```

### ❌ WRONG - Never hardcode values
```css
.my-button {
  background: #1e3a8a;          /* Should be var(--primary-color) */
  color: white;
  box-shadow: 0 10px 40px rgba(30, 58, 138, 0.12);  /* Should be var(--shadow-lg) */
  transition: all 0.3s ease;    /* Should use var(--transition-normal) */
}
```

---

## Customization Guide

### To change all primary colors:
1. Open `shared-styles.css`
2. Find `:root { }`
3. Update these variables:
   ```css
   --primary-color: #new-color;
   --primary-dark: #darker-shade;
   --primary-light: #lighter-shade;
   --gradient-primary: linear-gradient(135deg, #color1 0%, #color2 100%);
   ```
4. All components using these variables will update automatically

### To change button transitions:
1. Update `--transition-fast` in `:root`
2. All button hover effects will use the new timing

### To change theme colors (gold accent):
1. Update `--accent-gold` variable
2. All cards, highlights, and accents will reflect the change

---

## Accessibility Considerations

### Color Contrast
All color combinations meet WCAG AA standards:
- Text on backgrounds: ≥ 4.5:1 contrast ratio
- Large text: ≥ 3:1 contrast ratio
- UI components: ≥ 3:1 contrast ratio

### Focus States
All interactive elements have visible focus:
```css
.btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

### Motion
Animations respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Tips

1. **CSS Variables are efficient** - No JavaScript overhead
2. **Cascading updates** - Change one variable, all related styles update
3. **Reduced file size** - No color duplication
4. **Faster browser rendering** - Computed values cached
5. **Easier maintenance** - Single source of truth

---

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Full support

CSS variables are supported in all modern browsers (IE 11 not supported, but that's acceptable).

---

## Testing Variables

To test if variables are working:

1. Open browser DevTools (F12)
2. Go to any element
3. Check computed styles
4. Should see actual colors, not `var()` notation
5. Change a variable and refresh - all elements should update

Example in DevTools:
```
computed: background: rgb(30, 58, 138)  ✓ (from --primary-color)
not: background: var(--primary-color)   ✗ (error)
```

---

## Common Issues

### Variables not applying?
- Check file load order (shared-styles.css first)
- Verify variable name spelling
- Check specificity (view-specific styles might override)

### Colors looking different than expected?
- Use browser DevTools to inspect
- Check if view-specific CSS is overriding
- Verify no hardcoded colors are present

### Transitions feel wrong?
- Check `--transition-fast/normal/slow` values
- Verify `--ease-smooth` is applied
- Look for conflicting CSS animations

---

**Last Updated**: February 2, 2026
**Maintenance**: All color and animation updates should go through shared-styles.css variables
