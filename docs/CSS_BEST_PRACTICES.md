# 🎨 CSS Best Practices - TOTL Agency

**Status:** CRITICAL - Prevents build failures  
**Purpose:** Ensure CSS compatibility and prevent PostCSS parser errors  
**Priority:** MANDATORY

---

## 🚨 CRITICAL CSS RULES

### **1. NEVER Use Tailwind Arbitrary Values in CSS Files**

#### ❌ **WRONG - Causes Build Failures**
```css
/* This will cause PostCSS parser errors */
.aspect-\\[4\\/5\\] {
  aspect-ratio: 4/5;
}

.aspect-\\[3\\/4\\] {
  aspect-ratio: 3/4;
}
```

#### ✅ **CORRECT - Use Custom CSS Classes**
```css
/* Use descriptive class names instead */
.aspect-4-5 {
  aspect-ratio: 4/5;
}

.aspect-3-4 {
  aspect-ratio: 3/4;
}

.aspect-3-2 {
  aspect-ratio: 3/2;
}

.aspect-4-3 {
  aspect-ratio: 4/3;
}

.aspect-16-9 {
  aspect-ratio: 16/9;
}
```

### **2. Component Usage**

#### ❌ **WRONG - In React Components**
```tsx
<div className="aspect-[4/5] sm:aspect-[3/4]">
```

#### ✅ **CORRECT - Use Custom Classes**
```tsx
<div className="aspect-4-5 sm:aspect-3-4">
```

---

## 📋 CSS Class Naming Convention

### **Aspect Ratio Classes**
| Class Name | Aspect Ratio | Usage |
|------------|--------------|-------|
| `.aspect-4-5` | 4:5 | Portrait images, talent cards |
| `.aspect-3-4` | 3:4 | Standard portrait |
| `.aspect-3-2` | 3:2 | Landscape photos |
| `.aspect-4-3` | 4:3 | Standard landscape |
| `.aspect-16-9` | 16:9 | Video thumbnails, headers |

### **Responsive Modifiers**
```tsx
// Use Tailwind responsive prefixes with custom classes
<div className="aspect-4-5 sm:aspect-3-4 md:aspect-4-5">
```

---

## 🔧 Implementation Guide

### **Step 1: Define CSS Classes**
Add to `app/globals.css`:
```css
/* Better aspect ratio handling on mobile */
.aspect-4-5 {
  aspect-ratio: 4/5;
}

.aspect-3-4 {
  aspect-ratio: 3/4;
}

.aspect-3-2 {
  aspect-ratio: 3/2;
}

.aspect-4-3 {
  aspect-ratio: 4/3;
}

.aspect-16-9 {
  aspect-ratio: 16/9;
}
```

### **Step 2: Use in Components**
```tsx
// Talent discovery cards
<div className="relative aspect-4-5 sm:aspect-3-4 md:aspect-4-5 image-sophisticated">

// Profile headers
<div className="relative aspect-16-9 sm:aspect-3-2 md:aspect-16-9 lg:h-96">

// Gig cards
<div className="relative aspect-4-3 overflow-hidden">
```

---

## 🚨 Common Build Errors & Solutions

### **Error: "Unexpected '/' found"**
```
Error: Unexpected "/" found.
at /app/globals.css:103:3
```

**Cause:** Using escaped Tailwind arbitrary values in CSS
**Solution:** Replace with custom CSS classes

### **Error: "Invalid CSS selector"**
```
Error: Invalid CSS selector
```

**Cause:** Malformed CSS selectors with escaped characters
**Solution:** Use simple, descriptive class names

---

## 📚 Best Practices

### **1. CSS Organization**
- Keep aspect ratio classes in `app/globals.css`
- Group related classes together
- Add comments explaining usage

### **2. Naming Conventions**
- Use descriptive names: `aspect-4-5` not `aspect-portrait`
- Use hyphens for multi-word classes
- Be consistent with existing patterns

### **3. Responsive Design**
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`
- Combine with custom classes: `aspect-4-5 sm:aspect-3-4`
- Test on multiple screen sizes

### **4. Performance**
- Define classes once in CSS, reuse in components
- Avoid inline styles for aspect ratios
- Use CSS custom properties for dynamic values

---

## 🔍 Validation Checklist

Before committing CSS changes:

- [ ] **No Tailwind arbitrary values in CSS files**
- [ ] **All aspect ratio classes defined in globals.css**
- [ ] **Components use custom classes, not arbitrary values**
- [ ] **CSS syntax is valid (no escaped characters)**
- [ ] **Build passes without CSS errors**
- [ ] **Responsive behavior works on all screen sizes**

---

## 🛠️ Debugging Tools

### **Check for Arbitrary Values**
```bash
# Search for problematic patterns
grep -r "aspect-\\\[" app/ --include="*.tsx" --include="*.ts"
grep -r "aspect-\\\[" app/globals.css
```

### **Validate CSS**
```bash
# Run build to check for CSS errors
npm run build
```

### **Test Responsive Design**
```bash
# Start dev server and test on different screen sizes
npm run dev
```

---

## 📖 Reference

### **Tailwind CSS Aspect Ratio**
- [Official Documentation](https://tailwindcss.com/docs/aspect-ratio)
- [Arbitrary Values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)

### **CSS Aspect Ratio**
- [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- [Browser Support](https://caniuse.com/mdn-css_properties_aspect-ratio)

---

**Remember: Always use custom CSS classes instead of Tailwind arbitrary values in CSS files to prevent build failures!**

---

*Last Updated: October 24, 2025*  
*Status: MANDATORY - Prevents build failures*
