import React, { useEffect, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ 
  children, 
  className = '', 
  style = {} 
}) => {
  const [colors, setColors] = useState({
    border: '#d1d5db',
    mutedForeground: '#9ca3af',
  });

  useEffect(() => {
    const updateColors = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      // 获取CSS变量值
      const borderValue = style.getPropertyValue('--border').trim();
      const mutedForegroundValue = style.getPropertyValue('--muted-foreground').trim();
      
      // 如果获取到CSS变量，转换为hsl颜色
      if (borderValue) {
        const borderColor = borderValue.includes('hsl') ? borderValue : `hsl(${borderValue})`;
        const mutedColor = mutedForegroundValue ? 
          (mutedForegroundValue.includes('hsl') ? mutedForegroundValue : `hsl(${mutedForegroundValue})`) : 
          borderColor;
        
        setColors({
          border: borderColor,
          mutedForeground: mutedColor,
        });
      }
    };

    // 延迟更新，确保CSS变量已经被应用
    setTimeout(updateColors, 100);
    
    // 监听主题变化
    const observer = new MutationObserver(() => {
      setTimeout(updateColors, 50);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    // 也监听style标签的变化
    const styleObserver = new MutationObserver(() => {
      setTimeout(updateColors, 50);
    });
    
    styleObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      styleObserver.disconnect();
    };
  }, []);

  return (
    <div className="custom-scrollbar-container">
      <Scrollbars
        style={style}
        className={className}
        renderThumbVertical={({ style, ...props }) => (
          <div
            {...props}
            className="custom-scrollbar-thumb"
            style={{
              ...style,
              backgroundColor: colors.border,
              borderRadius: '4px',
              cursor: 'pointer',
              minHeight: '20px',
              transition: 'all 0.2s ease',
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.mutedForeground;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.border;
            }}
          />
        )}
        renderTrackVertical={({ style, ...props }) => (
          <div
            {...props}
            className="custom-scrollbar-track"
            style={{
              ...style,
              backgroundColor: 'transparent',
              right: '2px',
              bottom: '2px',
              top: '2px',
              borderRadius: '4px',
              width: '8px',
            }}
          />
        )}
        renderThumbHorizontal={() => <div style={{ display: 'none' }} />}
        renderTrackHorizontal={() => <div style={{ display: 'none' }} />}
      >
        {children}
      </Scrollbars>
    </div>
  );
};
