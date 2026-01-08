
import React, { ReactNode } from 'react';

// --- ICONS ---
// Using Heroicons SVG strings for simplicity without adding a library.
export const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M-7.5 12h13.5" />
  </svg>
);

export const HomeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

export const ListIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

export const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

export const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.036C6.91 2.75 6 3.704 6 4.868v.916m7.5 0c-1.122 0-2.245.039-3.368.114-1.121.075-2.242.15-3.368.225" />
  </svg>
);

export const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

export const CopyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
);


// --- COMPONENTS ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary hover:bg-slate-600 focus:ring-secondary text-white',
    danger: 'bg-danger hover:bg-red-600 focus:ring-danger',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'full' | 'fullscreen';
  hideCloseButton?: boolean; // Nova prop para esconder o botão X
  titleClassName?: string;
  headerActions?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'medium', hideCloseButton = false, titleClassName, headerActions }) => {
  if (!isOpen) return null;

  const isFullscreen = size === 'fullscreen';

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 bg-white flex flex-col rounded-none">
          {title && (
            <div className="flex justify-between items-center border-b px-6 py-3">
              <h3 className={`font-semibold ${titleClassName || 'text-slate-700'} text-lg`}>{title}</h3>
              <div className="flex items-center gap-2">
                {headerActions}
                {!hideCloseButton && (
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          {footer && (
            <div className="flex justify-end items-center gap-3 p-4 border-t bg-slate-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-0">
      <div className={`bg-white shadow-xl w-full flex flex-col animate-scale-in ${sizeClasses[size]} max-h-[90vh] rounded-lg m-4`}>
        {title && (
          <div className="flex justify-between items-center border-b p-4">
            <h3 className={`font-semibold ${titleClassName || 'text-slate-700'} text-xl`}>{title}</h3>
            <div className="flex items-center gap-2">
              {headerActions}
              {!hideCloseButton && (
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                  <XIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end items-center gap-3 p-4 border-t bg-slate-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface CardProps {
    children: ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
            {children}
        </div>
    );
};

interface BadgeProps {
    color: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
    children: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color, children }) => {
    const colorClasses = {
        green: 'bg-green-100 text-green-800',
        red: 'bg-red-100 text-red-800',
        blue: 'bg-blue-100 text-blue-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        gray: 'bg-slate-100 text-slate-800',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color]}`}>
            {children}
        </span>
    );
};

interface FormFieldProps {
    label: string;
    children: ReactNode;
    error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, error }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {children}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = (props) => (
    <input
        {...props}
        className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-slate-100 ${props.className}`}
    />
);


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: ReactNode;
}

export const Select: React.FC<SelectProps> = ({ children, ...props }) => (
    <select
        {...props}
        className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-slate-100 ${props.className}`}
    >
        {children}
    </select>
);

// --- PROGRESS BAR ---
interface ProgressBarProps {
  progress?: number; // 0-100
  indeterminate?: boolean;
  className?: string;
  label?: string;
  showPercentage?: boolean;
  progressInfo?: {
    current: number;
    total: number;
    percentage: number;
    message?: string;
  };
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress = 0, 
  indeterminate = false, 
  className = '', 
  label,
  showPercentage = false,
  progressInfo
}) => {
  // Use progressInfo if available, otherwise use individual props
  const currentProgress = progressInfo?.percentage ?? progress;
  const isIndeterminate = indeterminate && !progressInfo;
  const displayLabel = progressInfo?.message ?? label;
  const shouldShowPercentage = showPercentage || !!progressInfo;

  return (
    <div className={`w-full ${className}`}>
      {displayLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">{displayLabel}</span>
          {shouldShowPercentage && !isIndeterminate && (
            <span className="text-sm text-slate-500">{Math.round(currentProgress)}%</span>
          )}
        </div>
      )}
      {progressInfo && (
        <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
          <span>{progressInfo.current} de {progressInfo.total}</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isIndeterminate 
              ? 'bg-blue-500 animate-pulse w-full' 
              : 'bg-blue-500'
          }`}
          style={isIndeterminate ? {} : { width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
        />
      </div>
    </div>
  );
};
