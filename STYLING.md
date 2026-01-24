# Styling Guide

This document defines the styling conventions for this project. **All contributors (including AI assistants) must follow these guidelines** to maintain consistency.

## Quick Reference

| What | How |
|------|-----|
| Class merging | Use `cn()` from `src/utils/cn.ts` |
| Conditional classes | `cn("base", condition && "active")` |
| Dark mode | Always add `dark:` variant |
| Template literals | **NEVER** use for className |

## 1. The `cn()` Function

**Always use `cn()` for className attributes.** It combines `clsx` and `tailwind-merge` to handle conditional classes and resolve Tailwind conflicts.

```tsx
// ✅ CORRECT
import { cn } from '../../utils/cn';

<div className={cn(
  "base-class",
  isActive && "active-class",
  { "conditional-class": someCondition }
)} />

// ❌ WRONG - Template literals
<div className={`base-class ${isActive ? 'active' : ''}`} />

// ❌ WRONG - String concatenation
<div className={"base-class " + (isActive ? "active" : "")} />

// ❌ WRONG - Direct clsx import
import { clsx } from 'clsx';  // Don't import clsx directly
```

## 2. Dark Mode

**Every color-related class must have a dark: variant.**

```tsx
// ✅ CORRECT
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />

// ❌ WRONG - Missing dark mode
<div className="bg-white text-slate-900" />
```

## 3. Color Palette

Use these colors consistently:

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Primary action** | `primary-500` (#F4971E) | `primary-400` |
| **Primary text** | `primary-700` (AA accessible) | `primary-300` |
| **Primary bg** | `primary-100` | `primary-900/20` |
| **Warning** | `yellow-500` | `yellow-400` |
| **Warning bg** | `amber-50` | `amber-900/20` |
| **Error** | `red-500` | `red-400` |
| **Success** | `emerald-500` | `emerald-400` |
| **Surface** | `white` | `slate-900` |
| **Surface secondary** | `slate-50` | `slate-800` |
| **Border** | `slate-200` | `slate-700/800` |
| **Text primary** | `slate-900` | `slate-100` |
| **Text secondary** | `slate-600` | `slate-400` |
| **Text muted** | `slate-500` | `slate-400` |

## 4. Component Classes (from index.css)

Use these pre-defined classes when applicable:

### Panels
```tsx
<div className="panel">...</div>           // Container with bg and border
<div className="panel-header">...</div>    // Header with bottom border
```

### Buttons
```tsx
<button className={cn("toggle-btn", isSelected ? "toggle-btn-selected" : "toggle-btn-unselected")} />
<button className={cn("card-btn", isSelected ? "card-btn-selected" : "card-btn-unselected")} />
```

### Text
```tsx
<h1 className="text-primary">...</h1>      // Main headings
<p className="text-secondary">...</p>      // Body text
<span className="text-muted">...</span>    // Hints, placeholders
```

### Forms
```tsx
<label className="input-label">...</label>
<input className="input-range" type="range" />
```

## 5. Spacing Scale

Use consistent spacing values:

| Size | Class | Use for |
|------|-------|---------|
| XS | `gap-2`, `p-2` | Tight spacing |
| SM | `gap-3`, `p-3` | Small components |
| MD | `gap-4`, `p-4` | Standard spacing |
| LG | `gap-6`, `p-6` | Section spacing |
| XL | `gap-8`, `p-8` | Major sections |

## 6. Border Radius

| Size | Class | Use for |
|------|-------|---------|
| Small | `rounded-lg` | Buttons, inputs |
| Medium | `rounded-xl` | Cards, panels |
| Large | `rounded-2xl` | Modals, major containers |

## 7. Z-Index Scale

**Never hardcode z-index values.** Use constants from `src/constants/zIndex.ts`:

```tsx
import { Z_INDEX } from '../constants/zIndex';

// ✅ CORRECT
<div style={{ zIndex: Z_INDEX.UI.SIDEBAR }}>...</div>
<div style={{ zIndex: Z_INDEX.MODAL.CONTENT }}>...</div>

// ❌ WRONG
<div className="z-50">...</div>
<div style={{ zIndex: 100 }}>...</div>
```

| Constant | Value | Use for |
|----------|-------|---------|
| `Z_INDEX.CANVAS.BASE` | 0 | Canvas background |
| `Z_INDEX.CANVAS.OVERLAY` | 10 | Canvas overlays, annotations |
| `Z_INDEX.UI.SIDEBAR` | 10 | Desktop sidebar |
| `Z_INDEX.UI.MOBILE_HEADER` | 20 | Mobile header bar |
| `Z_INDEX.UI.MOBILE_TOOLBAR` | 30 | Mobile bottom toolbar |
| `Z_INDEX.UI.FLOATING_CONTROLS` | 50 | Zoom controls, floating buttons |
| `Z_INDEX.MODAL.BACKDROP` | 50 | Modal backdrop |
| `Z_INDEX.CANVAS.DRAG_PREVIEW` | 60 | Items being dragged |
| `Z_INDEX.MODAL.CONTENT` | 60 | Modal content |
| `Z_INDEX.UI.NOTIFICATIONS` | 100 | Toast notifications (always on top) |

## 8. Complex Conditional Styles

For complex conditions, extract styles to helper functions or constants:

```tsx
// ✅ CORRECT - Helper function for complex logic
function getButtonStyles(isSelected: boolean, variant: 'primary' | 'warning') {
  if (!isSelected) {
    return "border-slate-200 dark:border-slate-700";
  }
  return variant === 'warning'
    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
    : "border-primary-500 bg-primary-100 dark:bg-primary-900/20";
}

<button className={cn("base-styles", getButtonStyles(isSelected, variant))} />

// ✅ CORRECT - Constants for repeated patterns
const BTN_BASE = "flex-1 py-2 text-sm border rounded-lg transition-colors";
const BTN_SELECTED = "bg-primary-600 border-primary-600 text-white";
const BTN_UNSELECTED = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";

<button className={cn(BTN_BASE, isSelected ? BTN_SELECTED : BTN_UNSELECTED)} />
```

## 9. Inline Styles

**Only use inline styles for truly dynamic values:**

```tsx
// ✅ OK - Dynamic value from data
<div style={{ backgroundColor: dynamicColor }} />
<div style={{ width: `${progress}%` }} />

// ❌ WRONG - Static value that could be a class
<div style={{ padding: '16px' }} />
<div style={{ display: 'flex' }} />
```

## 10. File Organization

```
src/
├── utils/
│   └── cn.ts          # Class merging utility (import from here)
├── index.css          # Global styles and component classes
└── tailwind.config.js # Tailwind configuration
```

## Examples

### Good Component
```tsx
import { cn } from '../../utils/cn';

function Card({ isSelected, children }) {
  return (
    <div className={cn(
      "card-btn",
      isSelected ? "card-btn-selected" : "card-btn-unselected"
    )}>
      <h3 className="text-primary font-semibold">{title}</h3>
      <p className="text-secondary text-sm">{description}</p>
    </div>
  );
}
```

### Bad Component (DON'T DO THIS)
```tsx
// ❌ Multiple issues
function Card({ isSelected, children }) {
  return (
    <div className={`p-4 rounded-xl border-2 ${isSelected ? 'border-primary-500 bg-primary-100' : 'border-slate-200'}`}>
      <h3 className="text-slate-900 font-semibold">{title}</h3>  {/* Missing dark mode */}
      <p style={{ color: '#64748b' }}>{description}</p>  {/* Inline style */}
    </div>
  );
}
```
