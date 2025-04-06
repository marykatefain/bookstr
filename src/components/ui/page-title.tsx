import React, { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  description,
  icon
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-3">
        {icon && <div>{icon}</div>}
        <h1 className="text-3xl font-bold font-serif text-bookverse-ink">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
};