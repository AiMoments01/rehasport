import React from 'react';
import { cva } from 'class-variance-authority';

const kpiCardVariants = cva(
  "p-6 rounded-lg shadow-md transition-all hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-800 dark:bg-gray-800 dark:text-white",
        blue: "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        green: "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100",
        orange: "bg-orange-50 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
        purple: "bg-purple-50 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
        yellow: "bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const KpiCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  trendValue, 
  variant = "default",
  isLoading = false
}) => {
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  
  return (
    <div className={kpiCardVariants({ variant })}>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium opacity-80">{title}</h3>
            {icon && icon}
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-sm mt-1 opacity-70">{description}</p>}
          </div>
          {trend && (
            <div className={`flex items-center mt-4 text-sm ${trendColor}`}>
              {trend === 'up' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              ) : trend === 'down' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KpiCard;
