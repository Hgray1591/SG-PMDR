import React, { useState, useEffect } from "react";
import { Theme } from "../types";

interface SpeechBubbleProps {
  message: string;
  theme: Theme;
  visible: boolean;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  theme,
  visible,
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 창 너비에 따른 말풍선 최소/최대 너비 계산
  const minBubbleWidth = Math.max(130, windowWidth * 0.5); // 창 너비의 30% 또는 최소 80px
  // const maxBubbleWidth = Math.min(250, windowWidth * 0.8); // 창 너비의 80% 또는 최대 250px

  // 텍스트 길이에 따른 예상 너비 계산
  const estimatedWidth = message.length * 11 + 12; // padding 포함

  // 텍스트 길이와 범위를 고려한 최종 너비
  const bubbleWidth = Math.min(minBubbleWidth, estimatedWidth);

  // 130 미만일 때 중앙 배치
  const isCentered = bubbleWidth < 130;
  const containerLeft = isCentered ? "50%" : "5px";
  const containerTransform = isCentered ? "translateX(-50%)" : "none";
  const tailLeft = isCentered ? "50%" : "50px";
  const tailTransform = isCentered ? "translateX(-50%)" : "none";

  // 메시지가 없거나 visible이 false면 아예 렌더링하지 않음
  if (!visible || !message) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "108px",
        left: containerLeft,
        transform: containerTransform,
        width: `${bubbleWidth}px`,
        minHeight: "45px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
        {/* 말풍선 */}
        <div
          style={{
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
            padding: "4px 5px",
            borderRadius: "10px",
            border: `2px solid ${theme.primaryColor}`,
            fontSize: "11px",
            fontWeight: "400",
            textAlign: "center",
            whiteSpace: "pre-wrap",
            wordBreak: "keep-all",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.3s ease-in",
          }}
        >
          {message}
        </div>
        {/* 말풍선 꼬리 */}
        <div
          style={{
            position: "absolute",
            bottom: "-8px",
            left: tailLeft,
            transform: tailTransform,
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `8px solid ${theme.primaryColor}`,
            animation: "fadeIn 0.3s ease-in",
          }}
        />
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SpeechBubble;
