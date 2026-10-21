import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: React.ReactNode;
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'default' | 'large';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  to, 
  variant = 'primary', 
  size = 'default',
  className = '', 
  onClick,
  type = 'button'
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out active:scale-[0.98] md:hover:-translate-y-[1px]";
  
  const sizeStyles = {
    small: "px-4 py-2 text-sm rounded-md", 
    default: "px-8 py-3 text-base rounded-md",
    large: "px-10 py-4 text-lg md:text-xl rounded-md tracking-wide", 
  };

  const variants = {
    primary: "border-transparent text-white bg-sage-primary hover:bg-sage-primary-hover shadow-sm hover:shadow",
    secondary: "border border-sage-primary text-sage-primary bg-transparent hover:bg-sage-surface-2 hover:shadow-xs",
    outline: "border border-sage-border text-sage-text bg-transparent hover:border-sage-primary hover:bg-sage-surface-2",
    text: "border-transparent text-sage-primary hover:text-sage-primary-hover px-0 rounded-none underline-offset-4 hover:underline md:hover:translate-y-0"
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={combinedClasses} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;