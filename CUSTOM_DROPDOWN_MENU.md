# Custom Dropdown Menu & Icon Selector

## 1. Custom Dropdown Menu untuk Device Row

## Deskripsi
Custom dropdown menu dengan styling yang clean dan modern, muncul di kanan setiap device row dengan animasi smooth.

## Fitur

### 🎨 **Styling**
- **Border Radius**: 8px untuk sudut yang rounded
- **Box Shadow**: Elevation 3 dengan shadow halus (0px 5px 15px rgba(0, 0, 0, 0.15))
- **Min Width**: 240px untuk lebar yang konsisten
- **Background**: Pure white (#ffffff)
- **Padding**: 8px vertical untuk spacing yang nyaman

### 📋 **Menu Items**

Setiap menu item memiliki:
- **Icon di kiri** (20px, warna #666)
- **Text dengan Typography** (14px, warna #333)
- **Hover effect** (background #f5f5f5)
- **Padding** yang konsisten (1.5 vertical, 2 horizontal)
- **Min width icon**: 36px untuk alignment yang rapi

### 🔧 **Menu Actions**

1. **Show history**
   - Icon: HistoryIcon
   - Action: View device history

2. **Follow**
   - Icon: NearMeIcon
   - Action: Follow device on map

3. **Follow (new window)**
   - Icon: OpenInNewIcon
   - Action: Open follow view in new window
   - Route: `#follow/{deviceId}`

4. **Street View (new window)**
   - Icon: NavigationIcon
   - Action: Open street view in new window
   - Route: `#street/{deviceId}`

5. **Send command**
   - Icon: SendIcon
   - Action: Send command to device

6. **Edit**
   - Icon: EditIcon
   - Action: Edit device settings

## Positioning

- **Anchor Origin**: Bottom Right (muncul dari bawah kanan button)
- **Transform Origin**: Top Right (expand dari atas kanan)
- **Margin Top**: 0.5 untuk spacing dari button

## Implementation

```jsx
<Menu
  anchorEl={menuAnchorEl}
  open={menuOpen}
  onClose={handleMenuClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  slotProps={{
    paper: {
      elevation: 3,
      sx: {
        minWidth: 240,
        borderRadius: '8px',
        mt: 0.5,
        backgroundColor: '#ffffff',
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
      },
    },
  }}
>
  <MenuItem sx={{ py: 1.5, px: 2 }}>
    <ListItemIcon sx={{ minWidth: 36 }}>
      <Icon sx={{ fontSize: 20, color: '#666' }} />
    </ListItemIcon>
    <Typography sx={{ fontSize: '14px', color: '#333' }}>
      Menu Text
    </Typography>
  </MenuItem>
</Menu>
```

## Behavior

- **Click Outside**: Menu menutup otomatis
- **Click Menu Item**: Execute action dan close menu
- **Stop Propagation**: Click menu tidak trigger device selection
- **Smooth Animation**: Default Material-UI transition

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Background | #ffffff | Menu background |
| Text | #333 | Menu item text |
| Icon | #666 | Menu item icons |
| Hover BG | #f5f5f5 | Hover background |
| Shadow | rgba(0,0,0,0.15) | Box shadow |

## Typography

- **Font Size**: 14px
- **Line Height**: Default Material-UI
- **Font Weight**: Regular (400)
- **Font Family**: Roboto (Material-UI default)

## Responsive

- Width tetap 240px di semua screen sizes
- Icon size tetap 20px
- Padding responsive dengan Material-UI spacing

## Accessibility

- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ ARIA labels via Material-UI
- ✅ Screen reader friendly

## Comparison dengan Default

**Before:**
- Dense layout
- Small icons
- Teks langsung tanpa Typography
- Basic styling

**After:**
- ✅ Spacious layout (py: 1.5)
- ✅ Larger icons (20px)
- ✅ Typography component dengan color control
- ✅ Custom shadow dan border radius
- ✅ Smooth hover effects
- ✅ Consistent spacing

---

## 2. Icon Selector Component untuk Marker Dialog

### Overview
Component tersendiri untuk memilih icon marker dengan fitur:
- ✅ Grid layout 6 kolom
- ✅ Preview icon yang dipilih
- ✅ No flicker (stable rendering)
- ✅ 20+ marker icons support
- ✅ Error handling dengan fallback

### Dialog Position
Dialog dipindahkan ke **kiri atas** (di atas sidebar) agar user bisa:
- Pick lat/long langsung dari map
- Lihat marker preview di map real-time
- Sesuai behavior web lama (PHP version)

**Position:**
```css
position: fixed;
left: 20px;
top: 80px;
margin: 0;
```

### IconSelector Component
**File:** `/src/main/places/IconSelector.jsx`

**Props:**
```javascript
<IconSelector
  value={formData.icon}           // Current selected icon
  onChange={(newIcon) => {...}}   // Callback saat icon dipilih
/>
```

**Features:**
- Grid 6x4 untuk icon display
- Hover effect dengan border blue
- Selected state dengan blue background
- Preview di bawah grid
- Scroll support
- Error handling

**Available Icons:**
- Vehicles: car, truck, bus, motorcycle, boat, plane, train, tram, van, pickup
- Special: animal, bicycle, person, helicopter, crane, offroad, ship, tractor, trolleybus
- Default colors: green, blue, red, yellow, orange, purple, neutral

### MarkerDialog Changes
**File:** `/src/main/places/MarkerDialog.jsx`

**Removed:**
- ❌ `const [iconTab, setIconTab]` - tidak perlu tabs
- ❌ `const handleIconSelect()` - handled by IconSelector
- ❌ `const DEFAULT_ICONS = [...]` - moved to IconSelector
- ❌ `const CUSTOM_ICONS = [...]` - moved to IconSelector
- ❌ Tabs & Tab components
- ❌ Manual icon grid rendering

**Added:**
- ✅ IconSelector import & usage
- ✅ Dialog position fixed (left top)
- ✅ Clean component structure

**Code Reduction:**
- Before: 473 lines
- After: 374 lines
- Removed: 99 lines (-21%)

### Benefits

1. **No Flicker**
   - Component-based dengan proper state
   - Stable img elements
   - Single render per selection

2. **Better UX**
   - Dialog position allows map click
   - Grid shows more icons
   - Preview confirms selection
   - Smooth interactions

3. **Clean Code**
   - Separation of concerns
   - Reusable component
   - Less code in MarkerDialog
   - Easier maintenance

4. **Matches Web Lama**
   - Dialog position similar
   - Icon selection intuitive
   - Familiar user flow

### Testing Checklist

#### Icon Selector
- [ ] Icons display in 6 columns
- [ ] Scroll works
- [ ] Click selects icon (blue border)
- [ ] Preview shows selected
- [ ] No flicker
- [ ] Error fallback works

#### Dialog Position
- [ ] Dialog at left top (20px, 80px)
- [ ] Doesn't overlap header
- [ ] Map still accessible
- [ ] Can pick location from map

#### Functionality
- [ ] Icon saves to formData
- [ ] Icon persists on edit
- [ ] Icon displays in table
- [ ] Save creates/updates marker

---

## Files Modified

- `/src/main/DeviceRow.jsx` - Updated Menu component with custom styling
