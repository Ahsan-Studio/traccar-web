import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CustomCheckbox.css';

const CustomCheckbox = ({ 
  checked = false,
  onChange,
  label = '',
  disabled = false,
  className = '',
  style = {},
  labelPosition = 'right', // 'left' or 'right'
  indeterminate = false,
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const checkboxRef = useRef(null);

  // Handle indeterminate state
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e) => {
    const newValue = e.target.checked;
    setIsChecked(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Sync with external checked prop changes
  if (checked !== isChecked) {
    setIsChecked(checked);
  }

  const checkboxElement = (
    <input
      ref={checkboxRef}
      type="checkbox"
      className={`custom-checkbox-input ${disabled ? 'disabled' : ''}`}
      checked={isChecked}
      onChange={handleChange}
      disabled={disabled}
    />
  );

  const labelElement = label && (
    <span className="custom-checkbox-label">{label}</span>
  );

  return (
    <label 
      className={`custom-checkbox-container ${className} ${disabled ? 'disabled' : ''}`}
      style={style}
    >
      {labelPosition === 'left' && labelElement}
      {checkboxElement}
      {labelPosition === 'right' && labelElement}
    </label>
  );
};

CustomCheckbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  labelPosition: PropTypes.oneOf(['left', 'right']),
  indeterminate: PropTypes.bool,
};

export default CustomCheckbox;
