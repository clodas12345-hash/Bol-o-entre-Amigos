import { useState, useEffect } from 'react';

export function useResponsiveLayout(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return {
    isMobile,
    isTablet: windowWidth >= breakpoint && windowWidth < 1024,
    isDesktop: windowWidth >= 1024,
    windowWidth,
    compactCardClass: isMobile ? 'p-2.5 text-xs rounded-xl space-y-2' : 'p-4 rounded-2xl space-y-4',
    compactTableClass: isMobile ? 'text-[11px] p-1.5' : 'text-sm p-3',
  };
}
