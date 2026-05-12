import React from 'react';

const Card = ({ children, className = '', title, subtitle, icon: Icon, action }) => {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div>
              {title && <h3 className="font-display font-semibold text-gray-900 text-base">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
