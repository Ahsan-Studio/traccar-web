import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CustomSelect.css';

const CustomSelect = ({
  value,
  onChange,
  options = [],
  groupedOptions = [], // V1 parity: support for optgroups
  placeholder = 'Select...',
  disabled = false,
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Get display value from flat options
  const getDisplayValue = () => {
    if (!value) return placeholder;

    // Check flat options first
    if (options.length > 0) {
      if (typeof options[0] === 'string') {
        return value;
      } else if (typeof options[0] === 'object') {
        const selected = options.find(opt => opt.value === value);
        if (selected) return selected.label;
      }
    }

    // Check grouped options
    if (groupedOptions.length > 0) {
      for (const group of groupedOptions) {
        const selected = group.options?.find(opt => opt.value === value);
        if (selected) return selected.label;
      }
    }

    return placeholder;
  };

  // Check if using grouped options
  const hasGroupedOptions = groupedOptions && groupedOptions.length > 0;

  return (
    <div
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''}`}
      ref={dropdownRef}
      style={style}
    >
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        <span className="custom-select-value">{getDisplayValue()}</span>
        <span className={`custom-select-arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
      </div>

      {isOpen && !hasGroupedOptions && (
        <ul className="custom-select-dropdown">
          {options.map((option, index) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            const isSelected = optionValue === value;

            return (
              <li
                key={index}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(optionValue)}
              >
                {optionLabel}
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && hasGroupedOptions && (
        <ul className="custom-select-dropdown">
          {groupedOptions.map((group, groupIndex) => (
            <li key={groupIndex} className="custom-select-optgroup">
              <div className="custom-select-optgroup-label">{group.group}</div>
              <ul className="custom-select-optgroup-options">
                {group.options?.map((option, optIndex) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={optIndex}
                      className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

CustomSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ),
  groupedOptions: PropTypes.arrayOf(
    PropTypes.shape({
      group: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
    })
  ),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default CustomSelect;
