import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CustomCheckbox from './CustomCheckbox';
import './CustomMultiSelect.css';

const CustomMultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Nothing selected',
  disabled = false,
  className = '',
  searchable = true,
  displayValue = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300; // max-height dari CSS
      
      let top;
      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        // Show below
        top = rect.bottom + 4;
      } else {
        // Show above
        top = rect.top - Math.min(dropdownHeight, spaceAbove) - 4;
      }
      
      setDropdownPosition({
        top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update position when opening dropdown
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen]);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle toggle dropdown
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Handle select all
  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.value));
    }
  };

  // Handle individual checkbox
  const handleCheckboxChange = (optionValue) => (e) => {
    e.stopPropagation();
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Get display text
  const getDisplayText = () => {
    if (displayValue) {
      // If displayValue is a function, call it with the value array
      if (typeof displayValue === 'function') {
        return displayValue(value);
      }
      // Otherwise, use it as a string
      return displayValue;
    }
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const selectedOption = options.find(opt => opt.value === value[0]);
      return selectedOption ? selectedOption.label : placeholder;
    }
    return `${value.length} selected`;
  };

  const allSelected = value.length === options.length && options.length > 0;
  const someSelected = value.length > 0 && value.length < options.length;

  return (
    <div className={`custom-multiselect ${disabled ? 'disabled' : ''} ${className}`} ref={dropdownRef}>
      <div className="custom-multiselect-trigger" onClick={handleToggle} ref={triggerRef}>
        <span className="custom-multiselect-value">{getDisplayText()}</span>
        <ExpandMoreIcon className={`custom-multiselect-arrow ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div 
          className="custom-multiselect-dropdown"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {searchable && (
            <div className="custom-multiselect-search">
              <SearchIcon className="custom-multiselect-search-icon" />
              <input
                type="text"
                className="custom-multiselect-search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="custom-multiselect-options">
            <div className="custom-multiselect-option" onClick={handleSelectAll}>
              <CustomCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
              />
              <span className="custom-multiselect-option-label">[Select all]</span>
            </div>

            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className="custom-multiselect-option"
                onClick={handleCheckboxChange(option.value)}
              >
                <CustomCheckbox
                  checked={value.includes(option.value)}
                  onChange={handleCheckboxChange(option.value)}
                />
                <span className="custom-multiselect-option-label">{option.label}</span>
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className="custom-multiselect-no-options">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

CustomMultiSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  searchable: PropTypes.bool,
  displayValue: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};

export default CustomMultiSelect;
