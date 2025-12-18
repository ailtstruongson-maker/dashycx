import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

// This component relies on a global `lucide.createIcons()` call
// made in a parent component (e.g., DashboardView.tsx) to transform the `<i>` tag into an SVG.
export const Icon: React.FC<IconProps> = ({ name, className = '', size = 5 }) => {
  // The previous useEffect hook that called `lucide.createIcons()` on the parent element
  // has been removed. This approach was causing race conditions where multiple sibling Icon
  // components would interfere with each other, leading to icons failing to render.
  // The rendering is now handled by a single, debounced call in the main `DashboardView`,
  // ensuring all `<i>` placeholders are in the DOM before the transformation runs.
  return (
    <i data-lucide={name} className={`w-${size} h-${size} ${className}`}></i>
  );
};
