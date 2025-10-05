import PropTypes from 'prop-types';
import './CustomButton.css';

const CustomButton = ({ 
  children,
  icon,
  iconPosition = 'left', // 'left' or 'right'
  onClick,
  variant = 'outlined', // 'outlined', 'contained', 'text'
  color = 'primary', // 'primary', 'secondary', 'success', 'error', 'default'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  fullWidth = false,
  className = '',
  style = {},
  type = 'button',
}) => {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  // Determine button mode
  const hasIcon = !!icon;
  const hasText = !!children;
  const isIconOnly = hasIcon && !hasText;

  const buttonClasses = [
    'custom-button',
    `custom-button-${variant}`,
    `custom-button-${color}`,
    `custom-button-${size}`,
    isIconOnly ? 'custom-button-icon-only' : '',
    fullWidth ? 'custom-button-full-width' : '',
    disabled ? 'custom-button-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      {hasIcon && iconPosition === 'left' && (
        <span className="custom-button-icon custom-button-icon-left">
          {icon}
        </span>
      )}
      
      {hasText && (
        <span className="custom-button-label">
          {children}
        </span>
      )}
      
      {hasIcon && iconPosition === 'right' && (
        <span className="custom-button-icon custom-button-icon-right">
          {icon}
        </span>
      )}
    </button>
  );
};

CustomButton.propTypes = {
  children: PropTypes.node,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['outlined', 'contained', 'text']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'default']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default CustomButton;
