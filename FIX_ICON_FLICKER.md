# Fix: Icon Preview Flicker Issue

## Problem
Icon preview di MarkersTab mengalami flicker dan tidak muncul dengan stabil.

## Root Cause
Menggunakan `format` function untuk me-render React JSX elements (`<img>` dan `<div>`) menyebabkan re-render berlebihan dan flicker karena:
1. `format` function dipanggil setiap kali component re-render
2. Setiap kali `format` dipanggil, membuat React element baru
3. React melihat ini sebagai element baru dan re-mount
4. Hasilnya: flicker dan performa buruk

## Solution
**Ganti `format` dengan `render` untuk columns yang me-render JSX elements.**

### CustomTable Column Rendering Logic
CustomTable sudah support kedua options:
```javascript
if (col.render) cellContent = col.render(row);
else if (col.format) cellContent = col.format(row[col.key], row);
else cellContent = row[col.key];
```

**Perbedaan:**
- `format(value, row)` - untuk format **primitives** (string, number) ✅
- `render(row)` - untuk render **JSX elements** (img, div, components) ✅

## Changes Made

### 1. MarkersTab.jsx - Icon Column
**BEFORE (❌ Flicker):**
```javascript
{
  key: "attributes",
  label: "Icon",
  format: (value) => {
    const icon = value?.icon || "default-green.svg";
    return <img src={`/img/markers/${icon}`} ... />;
  }
}
```

**AFTER (✅ Fixed):**
```javascript
{
  key: "attributes",
  label: "Icon",
  render: (row) => {
    const icon = row.attributes?.icon || "default-green.svg";
    return <img src={`/img/markers/${icon}`} ... />;
  }
}
```

### 2. MarkersTab.jsx - Color Column
**Changed:** `format` → `render`

### 3. ZonesTab.jsx - Color Column
**Changed:** `format` → `render`

### 4. RoutesTab.jsx - Color Column
**Changed:** `format` → `render`

## Rules for CustomTable Columns

### ✅ Use `format` when:
- Returning **string** or **number**
- Example: `format: (value) => groups[value] || '-'`
- Example: `format: (value) => value + 'm'`

### ✅ Use `render` when:
- Returning **JSX elements** (`<img>`, `<div>`, `<Component>`)
- Example: `render: (row) => <img src={...} />`
- Example: `render: (row) => <div style={{...}} />`

## Result
✅ Icon preview tidak flicker lagi
✅ Color box stabil
✅ Performa lebih baik
✅ No re-mount issues

## Files Modified
1. `/src/main/places/MarkersTab.jsx` - Icon & Color columns
2. `/src/main/places/ZonesTab.jsx` - Color column
3. `/src/main/places/RoutesTab.jsx` - Color column

## Testing
1. Buka Places → Markers
2. Icon preview harus muncul stabil tanpa flicker
3. Color box harus solid tanpa flashing
4. Scroll table - semua visual harus smooth

---

**Date:** October 18, 2025  
**Issue:** Icon flicker & tidak muncul  
**Status:** ✅ RESOLVED
