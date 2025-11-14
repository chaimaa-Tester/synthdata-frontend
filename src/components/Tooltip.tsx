import React, { useState, ReactNode, useRef, useEffect } from "react";

type Props = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Tooltip: React.FC<Props> = ({ content, children, className }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!visible || !ref.current) {
      setPos(null);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    setPos({ left: rect.left + rect.width / 2, top: rect.top });
  }, [visible]);

  return (
    <div
      style={{ display: "inline-block", position: "relative" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      ref={ref}
      className={className}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "fixed",
            left: pos ? pos.left : 0,
            top: pos ? pos.top - 8 : 0,
            transform: "translate(-50%, -100%)",
            background: "rgb(31, 53, 88)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 6,
            zIndex: 20000,
            maxWidth: 320,
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            fontSize: 13,
            lineHeight: 1.3,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
