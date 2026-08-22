import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...(borderRadius !== undefined && { borderRadius }),
  };

  return (
    <div
      className={clsx('skeleton', className)}
      style={customStyle}
      {...props}
    />
  );
}
