# Custom Components Library

Reusable custom form components with consistent styling and enhanced UX.

## 📁 Structure

```
src/common/components/custom/
├── index.js                    # Barrel export
├── README.md                   # This file
│
├── CustomSelect.jsx            # Custom dropdown component
├── CustomSelect.css
├── CustomSelect.README.md
│
├── CustomCheckbox.jsx          # Custom checkbox component
├── CustomCheckbox.css
├── CustomCheckbox.README.md
│
├── CustomInput.jsx             # Custom input component
├── CustomInput.css
├── CustomInput.README.md
│
├── CustomButton.jsx            # Custom button component
├── CustomButton.css
└── CustomButton.README.md
```

## 🚀 Quick Start

### Import Components

```jsx
// Import all at once
import { 
  CustomSelect, 
  CustomCheckbox, 
  CustomInput, 
  CustomButton 
} from '../../common/components/custom';

// Or import individually
import CustomSelect from '../../common/components/custom/CustomSelect';
import CustomCheckbox from '../../common/components/custom/CustomCheckbox';
import CustomInput from '../../common/components/custom/CustomInput';
import CustomButton from '../../common/components/custom/CustomButton';
```

### Usage Examples

```jsx
function MyForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [agree, setAgree] = useState(false);

  return (
    <div>
      {/* Text Input */}
      <CustomInput
        value={name}
        onChange={(value) => setName(value)}
        placeholder="Enter your name"
      />

      {/* Email Input */}
      <CustomInput
        type="email"
        value={email}
        onChange={(value) => setEmail(value)}
        placeholder="email@example.com"
      />

      {/* Select Dropdown */}
      <CustomSelect
        value={country}
        onChange={(value) => setCountry(value)}
        options={["USA", "UK", "Indonesia"]}
      />

      {/* Checkbox with Label */}
      <CustomCheckbox
        checked={agree}
        onChange={(checked) => setAgree(checked)}
        label="I agree to terms and conditions"
      />

      {/* Submit Button */}
      <CustomButton 
        variant="contained" 
        color="primary"
        type="submit"
      >
        Submit
      </CustomButton>
    </div>
  );
}
```

## 📦 Components

### 1. CustomSelect
Custom dropdown with full styling control.

**Features:**
- ✅ Custom dropdown menu design
- ✅ Click outside to close
- ✅ Selected state highlight
- ✅ Scrollable options
- ✅ String or object array support

**Usage:**
```jsx
<CustomSelect
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  options={["Option 1", "Option 2", "Option 3"]}
/>
```

📖 [Full Documentation](./CustomSelect.README.md)

---

### 2. CustomCheckbox
Custom checkbox with animated checkmark.

**Features:**
- ✅ Custom checkmark animation
- ✅ Hover & focus states
- ✅ Label support (left/right)
- ✅ Disabled state
- ✅ Smooth transitions

**Usage:**
```jsx
<CustomCheckbox
  checked={isChecked}
  onChange={(checked) => setIsChecked(checked)}
  label="Enable feature"
/>
```

📖 [Full Documentation](./CustomCheckbox.README.md)

---

### 3. CustomInput
Custom input with all HTML5 types support.

**Features:**
- ✅ All input types (text, email, number, date, time, color, etc.)
- ✅ Focus & hover states
- ✅ Error & success states
- ✅ Size variants
- ✅ Keyboard events support

**Usage:**
```jsx
<CustomInput
  type="text"
  value={value}
  onChange={(value) => setValue(value)}
  placeholder="Enter value..."
/>
```

📖 [Full Documentation](./CustomInput.README.md)

---

### 4. CustomButton
Flexible button with icon support.

**Features:**
- ✅ 3 Display modes (Icon only, Text only, Icon + Text)
- ✅ 3 Variants (Outlined, Contained, Text)
- ✅ 5 Colors (Primary, Secondary, Success, Error, Default)
- ✅ Icon positioning (Left/Right)
- ✅ Size variants

**Usage:**
```jsx
{/* Text Only */}
<CustomButton onClick={handleClick}>
  Click Me
</CustomButton>

{/* Icon Only */}
<CustomButton icon={<span>▶</span>} onClick={handlePlay} />

{/* Icon + Text */}
<CustomButton icon={<span>💾</span>} onClick={handleSave}>
  Save
</CustomButton>
```

📖 [Full Documentation](./CustomButton.README.md)

---

## 🎨 Styling

All components share consistent styling:

- **Primary Color:** `#2196f3` (Blue)
- **Border Color:** `#ccc` (Gray)
- **Focus Shadow:** `rgba(33, 150, 243, 0.1)`
- **Disabled Color:** `#f5f5f5`
- **Font Size:** `13px`
- **Height:** `32px` (default)
- **Border Radius:** `4px`

### Global CSS Override

You can override styles globally in `/public/styles.css`:

```css
/* Change all custom components primary color */
.custom-select-trigger:focus,
.custom-checkbox-input:checked,
.custom-input:focus {
  border-color: #ff5722; /* Your color */
}
```

## 🔧 Migration Guide

### From Native HTML Elements

```jsx
// ❌ Before
<select className="custom-select" value={x} onChange={(e) => setX(e.target.value)}>
  <option>Option 1</option>
</select>

<input type="checkbox" checked={y} onChange={(e) => setY(e.target.checked)} />

<input type="text" value={z} onChange={(e) => setZ(e.target.value)} />

// ✅ After
<CustomSelect value={x} onChange={(value) => setX(value)} options={["Option 1"]} />

<CustomCheckbox checked={y} onChange={(checked) => setY(checked)} />

<CustomInput value={z} onChange={(value) => setValue(value)} />
```

**Benefits:**
- Cleaner syntax (no event.target.value)
- Consistent styling
- Better UX (animations, states)
- Easier to maintain

## 📂 Usage in Project

Currently used in:
- ✅ `/src/settings/userinterface/UserInterfaceTab.jsx`
- ✅ `/src/settings/sms/SMSTab.jsx`

## 🛠️ Development

### Adding New Component

1. Create component files:
   ```
   CustomComponent.jsx
   CustomComponent.css
   CustomComponent.README.md
   ```

2. Add to `index.js`:
   ```js
   export { default as CustomComponent } from './CustomComponent';
   ```

3. Update this README with component info

### Testing Components

```jsx
import { CustomSelect, CustomCheckbox, CustomInput } from './custom';

function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <CustomInput placeholder="Test input..." />
      <CustomSelect options={["Test 1", "Test 2"]} />
      <CustomCheckbox label="Test checkbox" />
    </div>
  );
}
```

## 📝 Props Summary

| Component | Key Props | onChange Signature |
|-----------|-----------|-------------------|
| CustomSelect | `value`, `options`, `placeholder` | `(value) => void` |
| CustomCheckbox | `checked`, `label`, `labelPosition` | `(checked) => void` |
| CustomInput | `type`, `value`, `placeholder` | `(value, event) => void` |
| CustomButton | `icon`, `variant`, `color`, `size` | `onClick(event) => void` |

## 🎯 Best Practices

1. **Always use controlled components** - Pass both `value` and `onChange`
2. **Use appropriate input types** - `type="email"` for emails, etc.
3. **Add labels for accessibility** - Use `label` prop for checkboxes
4. **Handle validation** - Add `className="error"` for error states
5. **Consistent sizing** - Use same width for aligned forms

## 📄 License

Part of Traccar Web project.
