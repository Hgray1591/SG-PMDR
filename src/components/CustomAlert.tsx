import { createPortal } from "react-dom";
import { Theme } from "../types";
import "../styles/CustomAlert.css";

interface CustomAlertProps {
  show: boolean;
  message: string;
  theme: Theme;
  onClose: () => void;
}

export const CustomAlert = ({
  show,
  message,
  theme,
  onClose,
}: CustomAlertProps) => {
  if (!show) return null;

  const alertContent = (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div
        className="custom-alert-box"
        style={{
          backgroundColor: theme.backgroundColor,
          border: `3px solid ${theme.primaryColor}`,
          color: theme.textColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-alert-message">{message}</div>
        <button
          className="custom-alert-button"
          style={{
            backgroundColor: theme.accentColor,
            color: theme.backgroundColor,
          }}
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>
  );

  return createPortal(alertContent, document.body);
};
