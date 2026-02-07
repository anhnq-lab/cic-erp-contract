---
name: dark-mode-polisher
description: Audit and fix dark mode issues in CIC ERP. Check contrast ratios, color consistency, and ensure all components have proper dark variants.
---

# Dark Mode Polisher Skill

## When to use
- After adding new components or pages
- When users report contrast or readability issues in dark mode
- During UI review passes

## Audit workflow
```
- [ ] Step 1: Review CSS variables for dark theme
- [ ] Step 2: Scan components for hardcoded colors
- [ ] Step 3: Check contrast ratios (text vs background)
- [ ] Step 4: Verify chart/recharts colors in dark mode
- [ ] Step 5: Fix issues found
- [ ] Step 6: Visual verification via browser screenshot
```

## CIC ERP CSS variable system
Styles are in `styles/` directory. Dark mode uses `[data-theme="dark"]` or `prefers-color-scheme: dark`.

### Required CSS variables
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  --bg-hover: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --border: #e2e8f0;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --bg-hover: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border: #334155;
  --primary: #818cf8;
  --primary-hover: #6366f1;
  --success: #4ade80;
  --warning: #fbbf24;
  --danger: #f87171;
  --shadow: 0 1px 3px rgba(0,0,0,0.4);
}
```

## Common dark mode issues

### 1. Hardcoded colors
```tsx
// ❌ Bad
<div style={{ color: '#333', background: '#fff' }}>

// ✅ Good
<div style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
```

### 2. Hardcoded CSS
```css
/* ❌ Bad */
.card { background: white; color: #333; border: 1px solid #eee; }

/* ✅ Good */
.card { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); }
```

### 3. SVG/Icon colors
```tsx
// ❌ Bad
<Icon color="#333" />

// ✅ Good
<Icon color="var(--text-secondary)" />
// or use currentColor
<Icon className="text-icon" /> // .text-icon { color: var(--text-secondary); }
```

### 4. Recharts in dark mode
```tsx
// ❌ Bad
<CartesianGrid stroke="#eee" />

// ✅ Good
<CartesianGrid stroke="var(--border)" />
<XAxis stroke="var(--text-secondary)" />
<Tooltip
  contentStyle={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '8px'
  }}
/>
```

### 5. Input/Form fields
```css
/* Ensure inputs are visible in dark mode */
input, select, textarea {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border);
}
input::placeholder { color: var(--text-tertiary); }
```

## Contrast requirements (WCAG AA)
- Normal text: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio against background

## Detection grep patterns
Search for hardcoded colors in `.tsx` and `.css` files:
```
color: ['"]#[0-9a-fA-F]{3,8}['"]
background: ['"]#[0-9a-fA-F]{3,8}['"]
background-color: #
border.*#[0-9a-fA-F]
fill: ['"]#
stroke: ['"]#
style=\{.*#[0-9a-fA-F]
```

## Verification
After fixes, use browser tool to screenshot the app in both light and dark mode to visually verify all components render correctly.
