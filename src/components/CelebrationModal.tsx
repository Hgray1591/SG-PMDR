import { useEffect, useState } from 'react';
import { Theme } from '../types';

interface CelebrationModalProps {
  show: boolean;
  completedSessions: number;
  dailyGoal: number;
  theme: Theme;
  onClose: () => void;
}

export const CelebrationModal = ({
  show,
  completedSessions,
  dailyGoal,
  theme,
  onClose,
}: CelebrationModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const handleBackdropClick = () => {
    setVisible(false);
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        onClick={handleModalClick}
        style={{
          backgroundColor: theme.backgroundColor,
          padding: '15px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${theme.primaryColor}`,
          boxShadow: `0 0 15px ${theme.accentColor}`,
          animation: 'bounceIn 0.5s ease',
          maxWidth: '200px',
        }}
      >
        <div style={{
          fontSize: '32px',
          marginBottom: '5px',
          animation: 'rotate 1s ease',
        }}>
          🏆
        </div>

        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: theme.primaryColor,
          marginBottom: '5px',
        }}>
          목표 달성!
        </div>

        <div style={{
          fontSize: '12px',
          color: theme.textColor,
        }}>
          {completedSessions}/{dailyGoal} 세션 완료!
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
