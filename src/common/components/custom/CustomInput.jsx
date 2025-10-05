import { useState } from 'react';
import PropTypes from 'prop-types';
import './CustomInput.css';

const CustomInput = ({ 
  type = 'text',
  value = '',
  onChange,
  placeholder = '',
  disabled = false,
  readOnly = false,
  className = '',
  style = {},
  maxLength,
  minLength,
  pattern,
  required = false,
  autoFocus = false,
  name = '',
  id = '',
  onFocus,
  onBlur,
  onKeyPress,
  onKeyDown,
  onKeyUp,
  startAdornment,
  endAdornment,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // If we have adornments, wrap in a container
  if (startAdornment || endAdornment) {
    return (
      <div className={`custom-input-wrapper ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''} ${className}`} style={style}>
        {startAdornment && <span className="custom-input-adornment start">{startAdornment}</span>}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          required={required}
          autoFocus={autoFocus}
          name={name}
          id={id}
          className="custom-input-field"
        />
        {endAdornment && <span className="custom-input-adornment end">{endAdornment}</span>}
      </div>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      required={required}
      autoFocus={autoFocus}
      name={name}
      id={id}
      className={`custom-input ${isFocused ? 'focused' : ''} ${disabled ? 'disabled' : ''} ${readOnly ? 'readonly' : ''} ${className}`}
      style={style}
    />
  );
};

CustomInput.propTypes = {
  type: PropTypes.oneOf([
    'text', 
    'password', 
    'email', 
    'number', 
    'tel', 
    'url', 
    'search',
    'date',
    'time',
    'datetime-local',
    'month',
    'week',
    'color'
  ]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  pattern: PropTypes.string,
  required: PropTypes.bool,
  autoFocus: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyPress: PropTypes.func,
  onKeyDown: PropTypes.func,
  onKeyUp: PropTypes.func,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
};

export default CustomInput;
