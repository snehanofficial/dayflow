import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [computedPosition, setComputedPosition] = useState(position);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Update coords and adaptive position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    // Default coordinates based on initial position
    let targetPosition = position;

    // Get viewport size
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let tooltipWidth = 0;
    let tooltipHeight = 0;
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      tooltipWidth = tooltipRect.width;
      tooltipHeight = tooltipRect.height;
    } else {
      // rough estimate to prevent first-render flash or offscreen position
      tooltipWidth = 120;
      tooltipHeight = 32;
    }

    // Function to calculate coords for a given position
    const calculateCoords = (pos: 'top' | 'right' | 'bottom' | 'left') => {
      let t = 0;
      let l = 0;
      switch (pos) {
        case 'top':
          t = triggerRect.top + scrollY - tooltipHeight - 8;
          l =
            triggerRect.left + scrollX + (triggerRect.width - tooltipWidth) / 2;
          break;
        case 'bottom':
          t = triggerRect.bottom + scrollY + 8;
          l =
            triggerRect.left + scrollX + (triggerRect.width - tooltipWidth) / 2;
          break;
        case 'left':
          t =
            triggerRect.top +
            scrollY +
            (triggerRect.height - tooltipHeight) / 2;
          l = triggerRect.left + scrollX - tooltipWidth - 8;
          break;
        case 'right':
          t =
            triggerRect.top +
            scrollY +
            (triggerRect.height - tooltipHeight) / 2;
          l = triggerRect.right + scrollX + 8;
          break;
      }
      return { t, l };
    };

    // Determine target position based on boundaries
    let { t: testTop, l: testLeft } = calculateCoords(targetPosition);

    // Check collisions for each position and adjust if necessary
    if (
      targetPosition === 'right' &&
      testLeft + tooltipWidth > viewportWidth + scrollX
    ) {
      const leftCoords = calculateCoords('left');
      if (leftCoords.l >= scrollX) {
        targetPosition = 'left';
        testTop = leftCoords.t;
        testLeft = leftCoords.l;
      } else {
        const topCoords = calculateCoords('top');
        if (topCoords.t >= scrollY) {
          targetPosition = 'top';
          testTop = topCoords.t;
          testLeft = topCoords.l;
        } else {
          targetPosition = 'bottom';
          const bottomCoords = calculateCoords('bottom');
          testTop = bottomCoords.t;
          testLeft = bottomCoords.l;
        }
      }
    } else if (targetPosition === 'left' && testLeft < scrollX) {
      const rightCoords = calculateCoords('right');
      if (rightCoords.l + tooltipWidth <= viewportWidth + scrollX) {
        targetPosition = 'right';
        testTop = rightCoords.t;
        testLeft = rightCoords.l;
      }
    } else if (targetPosition === 'top' && testTop < scrollY) {
      const bottomCoords = calculateCoords('bottom');
      if (bottomCoords.t + tooltipHeight <= viewportHeight + scrollY) {
        targetPosition = 'bottom';
        testTop = bottomCoords.t;
        testLeft = bottomCoords.l;
      }
    } else if (
      targetPosition === 'bottom' &&
      testTop + tooltipHeight > viewportHeight + scrollY
    ) {
      const topCoords = calculateCoords('top');
      if (topCoords.t >= scrollY) {
        targetPosition = 'top';
        testTop = topCoords.t;
        testLeft = topCoords.l;
      }
    }

    // Ensure the tooltip is within horizontal/vertical bounds regardless
    testLeft = Math.max(
      scrollX + 4,
      Math.min(testLeft, viewportWidth + scrollX - tooltipWidth - 4),
    );
    testTop = Math.max(
      scrollY + 4,
      Math.min(testTop, viewportHeight + scrollY - tooltipHeight - 4),
    );

    setCoords({ top: testTop, left: testLeft });
    setComputedPosition(targetPosition);
  }, [position]);

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true); // listen in capture phase to capture nested scrolls
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      updatePosition();
    }
  }, [isVisible, content, updatePosition]);

  return (
    <div
      ref={triggerRef}
      className="tooltip-trigger"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip-content tooltip-portal tooltip-${computedPosition}`}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              opacity: tooltipRef.current ? 1 : 0,
            }}
            role="tooltip"
          >
            {content}
            <span
              className={`tooltip-arrow tooltip-arrow-${computedPosition}`}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Tooltip;
