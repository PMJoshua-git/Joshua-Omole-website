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
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 transform active:scale-95";
  
  const sizeStyles = {
    small: "px-5 py-2 text-sm rounded-full", 
    default: "px-8 py-3 text-base rounded-full",
    large: "px-10 py-4 text-lg md:text-xl rounded-full tracking-wide", 
  };

  const variants = {
    primary: "border-transparent text-white bg-neon-gradient hover:bg-neon-gradient-hover shadow-glow hover:shadow-glow-hover hover:-translate-y-0.5",
    secondary: "border-transparent text-white bg-white/10 hover:bg-white/20 backdrop-blur-md shadow-sm hover:shadow-md border border-white/5",
    outline: "border border-navy text-silver bg-transparent hover:border-blue hover:text-white hover:bg-blue/10 hover:shadow-glow",
    text: "border-transparent text-blue hover:text-purple px-0 rounded-none underline-offset-4 hover:underline"
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
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