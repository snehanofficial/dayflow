import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import { clsx } from 'clsx';

interface DropdownItem {
  label: string;
  onClick: () => void;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  className = '',
  style,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [verticalDirection, setVerticalDirection] = useState<'top' | 'bottom'>(
    'bottom',
  );
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>(
    align,
  );
  const [isCalculated, setIsCalculated] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !menuRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Vertical adaptive check
    let nextVertical: 'top' | 'bottom' = 'bottom';
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
      nextVertical = 'top';
    }

    // Horizontal adaptive check
    let nextHorizontal = align;
    if (align === 'right') {
      const leftEdge = rect.right - menuRect.width;
      if (leftEdge < 0 && rect.left + menuRect.width <= viewportWidth) {
        nextHorizontal = 'left';
      }
    } else {
      const rightEdge = rect.left + menuRect.width;
      if (rightEdge > viewportWidth && rect.right - menuRect.width >= 0) {
        nextHorizontal = 'right';
      }
    }

    setVerticalDirection(nextVertical);
    setHorizontalAlign(nextHorizontal);
    setIsCalculated(true);
  }, [align]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      setIsCalculated(false);
    }
  }, [isOpen, updatePosition]);

  return (
    <div
      className={clsx('dropdown-container', className)}
      ref={containerRef}
      style={style}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: style?.width === '100%' ? 'flex' : 'inline-flex',
          width: style?.width === '100%' ? '100%' : 'auto',
          cursor: 'pointer',
        }}
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          className="dropdown-menu"
          style={{
            position: 'absolute',
            top: verticalDirection === 'bottom' ? '100%' : 'auto',
            bottom: verticalDirection === 'top' ? '100%' : 'auto',
            left: horizontalAlign === 'left' ? 0 : 'auto',
            right: horizontalAlign === 'right' ? 0 : 'auto',
            marginTop: verticalDirection === 'bottom' ? 'var(--space-1)' : 0,
            marginBottom: verticalDirection === 'top' ? 'var(--space-1)' : 0,
            opacity: isCalculated ? 1 : 0,
            visibility: isCalculated ? 'visible' : 'hidden',
          }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              className="dropdown-item"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default Dropdown;
