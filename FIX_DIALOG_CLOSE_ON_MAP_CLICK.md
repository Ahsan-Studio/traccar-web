# Fix: Dialog Closes When Clicking Map

## Problem
1. Dialog otomatis tertutup saat user klik map untuk pick location
2. User tidak bisa menggunakan fitur map click karena dialog langsung close
3. **MuiDialog-container** mengcover map area dan block semua pointer events

## Root Cause

### Issue 1: MuiDialog-container Blocks Pointer Events ⚠️
```html
<!-- Dialog container mengcover seluruh layar -->
<div class="MuiDialog-container" 
     role="presentation" 
     style="opacity: 1">
  <!-- Container ini block ALL click events -->
  <!-- Termasuk click ke map di belakang -->
</div>
```

**Problem:**
- MUI Dialog default: Container div cover 100% viewport
- `pointer-events: auto` (default) pada container
- Semua click ditangkap oleh container, tidak sampai ke map
- Walaupun `hideBackdrop={true}`, container tetap ada

### Issue 2: onClose Triggered by Any Click
```javascript
// ❌ BEFORE
<Dialog 
  open={open} 
  onClose={onClose}  // ← Ter-trigger oleh ANY close reason
  hideBackdrop={true}
>
```

**Behavior:**
- MUI Dialog default: `onClose` ter-trigger oleh:
  - Backdrop click (klik di luar dialog)
  - Escape key
  - Close button click
- Walaupun `hideBackdrop={true}`, event handler tetap jalan
- Click map → dianggap sebagai "outside dialog" → `onClose()` called

### Issue 2: Close Button Direct Call
```javascript
// ❌ BEFORE
<IconButton onClick={onClose}>  // ← Direct call without param
  <CloseIcon />
</IconButton>
```

**Problem:**
- `onClose` dipanggil tanpa parameter `(false)`
- Inconsistent dengan Cancel button yang call `onClose(false)`

## Solution

### 1. Disable Container Pointer Events ✅ **CRITICAL FIX**
```javascript
// ✅ SOLUTION
const useStyles = makeStyles()((theme) => ({
  dialog: {
    // Container tidak block pointer events
    "& .MuiDialog-container": {
      pointerEvents: "none",  // ← Container transparent untuk clicks
    },
    "& .MuiDialog-paper": {
      pointerEvents: "auto",  // ← Paper menerima clicks
      width: "360px",
      position: "fixed",
      left: "20px",
      top: "80px",
      margin: 0,
    },
  },
}));
```

**How it Works:**
```
┌─────────────────────────────────────┐
│ MuiDialog-container                 │
│ (pointer-events: none)              │ ← Clicks pass through!
│                                     │
│  ┌──────────────┐                  │
│  │ Dialog Paper │  [MAP AREA]      │
│  │ (pointer:    │  ← Clickable!    │
│  │  auto)       │                  │
│  └──────────────┘                  │
│                                     │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Container **transparent** untuk pointer events
- ✅ Dialog paper tetap **interactive**
- ✅ Map di belakang **fully clickable**
- ✅ No overlay blocking

### 2. Filter onClose Reasons ✅
```javascript
// ✅ AFTER
<Dialog 
  open={open} 
  onClose={(event, reason) => {
    // Only allow close via button, not backdrop or escape
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return; // ← Block close from these reasons
    }
    onClose(false);
  }}
  hideBackdrop={true}
  disableEnforceFocus={true}
  disableAutoFocus={true}
  disableEscapeKeyDown={true}  // ← Extra safety
>
```

**Benefits:**
- `backdropClick` → ignored (return early)
- `escapeKeyDown` → ignored (return early)
- Only close via button click
- Map click tidak trigger close

### 2. Consistent Close Handler ✅
```javascript
// ✅ AFTER
const handleCancel = () => {
  onClose(false);
};

// Close button (X)
<IconButton onClick={handleCancel}>  // ← Use handleCancel
  <CloseIcon />
</IconButton>

// Cancel button
<CustomButton onClick={handleCancel}>  // ← Use handleCancel
  Cancel
</CustomButton>
```

**Benefits:**
- Single source of truth
- Consistent behavior
- Always pass `false` parameter
- Easy to add logic (e.g., confirm dialog)

## Dialog Props Explanation

### disableEscapeKeyDown
- **Purpose:** Prevent Escape key from closing dialog
- **Why:** User might press Escape accidentally
- **Set to:** `true`

### hideBackdrop
- **Purpose:** Remove dark overlay
- **Why:** Map needs to be visible and clickable
- **Set to:** `true`

### disableEnforceFocus
- **Purpose:** Allow focus outside dialog
- **Why:** User needs to interact with map
- **Set to:** `true`

### disableAutoFocus
- **Purpose:** Don't auto-focus first input
- **Why:** User wants to click map first
- **Set to:** `true`

### onClose Filter
- **Purpose:** Control which events can close dialog
- **Why:** Prevent accidental closes
- **Logic:** 
  ```javascript
  if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
    return; // Block
  }
  onClose(false); // Allow
  ```

## Testing

### ✅ Map Click Should NOT Close Dialog
1. Open dialog (Add marker)
2. **Click map** → Dialog tetap open
3. **Click map multiple times** → Dialog tetap open
4. Lat/Long update setiap click
5. Dialog hanya close via button

### ✅ Close Button Works
1. Open dialog
2. Click **X button** (top right)
3. Dialog closes
4. Map click disabled

### ✅ Cancel Button Works
1. Open dialog
2. Fill some data
3. Click **Cancel button**
4. Dialog closes
5. Data not saved

### ✅ Save Button Works
1. Open dialog
2. Click map to pick location
3. Fill name
4. Click **Save button**
5. Dialog closes
6. Marker created

### ✅ Escape Key Blocked
1. Open dialog
2. Press **Escape key**
3. Dialog tetap open (NOT closed)
4. Must use button to close

### ✅ Click Outside Blocked
1. Open dialog
2. Click **sidebar area**
3. Dialog tetap open
4. Click **empty map area**
5. Dialog tetap open
6. Only button can close

## Comparison

### Before (❌ Problem):
```javascript
User Flow:
1. Click "Add"
2. Dialog opens
3. Click map → Dialog CLOSES ❌
4. Frustrated user 😠

onClose Behavior:
- backdropClick → CLOSES dialog ❌
- escapeKeyDown → CLOSES dialog ❌
- buttonClick → CLOSES dialog ✅
```

### After (✅ Fixed):
```javascript
User Flow:
1. Click "Add"
2. Dialog opens
3. Click map → Lat/Long filled ✅
4. Click map again → Updated ✅
5. Click Save → Dialog closes ✅
6. Happy user 😊

onClose Behavior:
- backdropClick → BLOCKED ✅
- escapeKeyDown → BLOCKED ✅
- buttonClick → CLOSES dialog ✅
```

## Code Changes

### File: MarkerDialog.jsx

**Change 1: Dialog onClose Handler**
```diff
  <Dialog 
    open={open} 
-   onClose={onClose}
+   onClose={(event, reason) => {
+     if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
+       return;
+     }
+     onClose(false);
+   }}
    className={classes.dialog}
    maxWidth={false}
    hideBackdrop={true}
    disableEnforceFocus={true}
    disableAutoFocus={true}
+   disableEscapeKeyDown={true}
  >
```

**Change 2: Close Button Handler**
```diff
  <DialogTitle className={classes.dialogTitle}>
    Marker properties
-   <IconButton onClick={onClose}>
+   <IconButton onClick={handleCancel}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>
```

## Benefits Summary

### 1. Map Click Works ✅
- User can click map multiple times
- Dialog stays open
- Coordinates update automatically

### 2. Intentional Close Only ✅
- Only button clicks close dialog
- No accidental closes
- Better user experience

### 3. Consistent Behavior ✅
- All close actions use handleCancel
- Single source of truth
- Easy to maintain

### 4. Flexible Control ✅
- Can add confirm dialog before close
- Can add validation
- Can add cleanup logic

## Related Issues

### Issue: "Map click closes dialog"
**Cause:** backdropClick triggers onClose  
**Fix:** Filter onClose reasons ✅

### Issue: "Escape closes dialog"
**Cause:** Default MUI behavior  
**Fix:** disableEscapeKeyDown + filter ✅

### Issue: "Can't click map multiple times"
**Cause:** First click closes dialog  
**Fix:** Block backdropClick ✅

## Future Enhancements

### 1. Confirm Before Close
```javascript
const handleCancel = () => {
  if (formData.name || formData.latitude) {
    if (confirm('Discard changes?')) {
      onClose(false);
    }
  } else {
    onClose(false);
  }
};
```

### 2. Save on Escape
```javascript
onClose={(event, reason) => {
  if (reason === 'escapeKeyDown') {
    handleSave(); // Auto-save
    return;
  }
  // ... rest of logic
}}
```

### 3. Click Outside to Cancel
```javascript
// Add checkbox in settings
const [allowClickOutside, setAllowClickOutside] = useState(false);

onClose={(event, reason) => {
  if (reason === 'backdropClick' && !allowClickOutside) {
    return;
  }
  // ...
}}
```

---

**Date:** October 18, 2025  
**Issue:** Dialog closes when clicking map  
**Status:** ✅ RESOLVED  
**Files Modified:** MarkerDialog.jsx (onClose handler + close button)
