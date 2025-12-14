import { useState, useEffect } from "react";
import { MESSAGES } from "../data/messages";
import { MessageType } from "../types";
import { getTheme } from "../utils/themes";
import "../styles/App.css";
import "../styles/MessagesPage.css";

function MessagesPage() {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const [messages, setMessages] = useState<Record<MessageType, string[]>>(
    () => {
      const saved = localStorage.getItem("customMessages");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 누락된 카테고리를 기본값으로 채움
          return {
            ...MESSAGES,
            ...parsed,
          };
        } catch {
          return MESSAGES;
        }
      }
      return MESSAGES;
    }
  );

  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem("themeId") || "sakura";
  });

  const [fontFamily, setFontFamily] = useState(() => {
    const savedSettings = localStorage.getItem("pomodoroSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return settings.fontFamily || "GMarketSans";
      } catch {
        return "GMarketSans";
      }
    }
    return "GMarketSans";
  });

  // 창이 표시될 때마다 애니메이션 활성화 및 테마/폰트 리셋
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    // 초기 마운트 시 애니메이션 활성화
    requestAnimationFrame(() => {
      setShouldAnimate(true);
    });

    const setupListener = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");

        // 창이 다시 표시될 때 이벤트 수신
        unlistenFn = await listen("messages-window-shown", () => {
          console.log("[Messages] window-shown event received");
          // 이벤트가 여러 번 와도 true로 덮어씌우면 React가 렌더링을 건너뛰므로 깜빡이지 않음
          setShouldAnimate(true);

          // 창이 다시 열릴 때 저장된 테마와 폰트로 리셋
          const savedThemeId = localStorage.getItem("themeId") || "sakura";
          setThemeId(savedThemeId);

          const savedSettings = localStorage.getItem("pomodoroSettings");
          if (savedSettings) {
            try {
              const settings = JSON.parse(savedSettings);
              const savedFont = settings.fontFamily || "GMarketSans";
              setFontFamily(savedFont);
            } catch {
              setFontFamily("GMarketSans");
            }
          }
        });
      } catch (error) {
        console.error("Failed to setup listener:", error);
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  const currentTheme = getTheme(themeId);

  // 테마 및 폰트 설정 변경 감지
  useEffect(() => {
    const lastChangeKey = "settingsChanged";
    let lastChangeTime = localStorage.getItem(lastChangeKey) || "0";

    const checkSettingsChange = () => {
      const currentChangeTime = localStorage.getItem(lastChangeKey) || "0";

      if (currentChangeTime !== lastChangeTime) {
        lastChangeTime = currentChangeTime;

        // 테마 변경 감지
        const savedThemeId = localStorage.getItem("themeId");
        if (savedThemeId && savedThemeId !== themeId) {
          setThemeId(savedThemeId);
        }

        // 폰트 변경 감지
        const savedSettings = localStorage.getItem("pomodoroSettings");
        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings);
            const newFont = settings.fontFamily || "GMarketSans";
            if (newFont !== fontFamily) {
              setFontFamily(newFont);
            }
          } catch {
            // Failed to parse settings
          }
        }
      }
    };

    const interval = setInterval(checkSettingsChange, 100);
    return () => clearInterval(interval);
  }, [fontFamily, themeId]);

  const [editingCategory, setEditingCategory] = useState<MessageType | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<{
    category: MessageType;
    index: number;
  } | null>(null);
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("customMessages", JSON.stringify(messages));
    localStorage.setItem("messagesChanged", Date.now().toString());
  }, [messages]);

  const addMessage = (category: MessageType) => {
    if (!newMessage.trim()) return;

    setMessages((prev) => ({
      ...prev,
      [category]: [...prev[category], newMessage.trim()],
    }));
    setNewMessage("");
    setEditingCategory(null);
  };

  const deleteMessage = (category: MessageType, index: number) => {
    setMessages((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const startEditMessage = (
    category: MessageType,
    index: number,
    currentText: string
  ) => {
    setEditingMessage({ category, index });
    setEditMessage(currentText);
  };

  const saveEditMessage = () => {
    if (!editingMessage || !editMessage.trim()) return;

    setMessages((prev) => ({
      ...prev,
      [editingMessage.category]: prev[editingMessage.category].map((msg, i) =>
        i === editingMessage.index ? editMessage.trim() : msg
      ),
    }));
    setEditingMessage(null);
    setEditMessage("");
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditMessage("");
  };

  const handleClose = async () => {
    // 애니메이션 리셋
    setShouldAnimate(false);

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const window = getCurrentWindow();
      await window.hide();
    } catch {
      // Failed to hide
    }
  };

  const categories: { key: MessageType; label: string }[] = [
    { key: "workStart", label: "업무 시작" },
    { key: "workProgress", label: "업무 진행 중" },
    { key: "workComplete", label: "업무 완료" },
    { key: "goalAchieved", label: "목표 달성" },
    { key: "imageClick", label: "이미지 클릭" },
  ];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        backgroundColor: "transparent",
        padding: "0px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontFamily,
      }}
    >
      <div
        className={`messages-modal ${shouldAnimate ? "animate" : ""}`}
        style={{
          backgroundColor: currentTheme.backgroundColor,
          border: `3px solid ${currentTheme.primaryColor}`,
        }}
        data-tauri-drag-region
      >
        <h2
          className="messages-header"
          style={{ color: currentTheme.accentColor }}
        >
          🗨️ 메시지 커스텀
        </h2>

        <div className="messages-content">
          {categories.map(({ key, label }) => (
            <div key={key} className="message-category">
              <h3
                className="message-category-title"
                style={{ color: currentTheme.primaryColor }}
              >
                {label}
              </h3>
              <div className="message-list">
                {messages[key].map((msg, index) => (
                  <div key={`${key}-${index}-${msg}`} className="message-item">
                    {editingMessage?.category === key &&
                    editingMessage?.index === index ? (
                      <>
                        <input
                          type="text"
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEditMessage();
                            } else if (e.key === "Escape") {
                              cancelEditMessage();
                            }
                          }}
                          autoFocus
                          autoComplete="off"
                          spellCheck="false"
                          className="message-input"
                          style={{
                            border: `2px solid ${currentTheme.primaryColor}`,
                            backgroundColor: currentTheme.backgroundColor,
                            color: currentTheme.textColor,
                            flex: 1,
                            marginRight: "4px",
                          }}
                        />
                        <button
                          onClick={saveEditMessage}
                          className="edit-message-button"
                          style={{
                            backgroundColor: currentTheme.primaryColor,
                            color: currentTheme.backgroundColor,
                          }}
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditMessage}
                          className="delete-message-button"
                          style={{
                            backgroundColor: currentTheme.accentColor,
                            color: currentTheme.backgroundColor,
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className="message-text"
                          style={{ color: currentTheme.textColor }}
                        >
                          {msg}
                        </span>
                        <button
                          onClick={() => startEditMessage(key, index, msg)}
                          className="edit-message-button"
                          style={{
                            backgroundColor: currentTheme.primaryColor,
                            color: currentTheme.backgroundColor,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteMessage(key, index)}
                          className="delete-message-button"
                          style={{
                            backgroundColor: currentTheme.accentColor,
                            color: currentTheme.backgroundColor,
                          }}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {editingCategory === key ? (
                <div className="add-message-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addMessage(key);
                      } else if (e.key === "Escape") {
                        setEditingCategory(null);
                        setNewMessage("");
                      }
                    }}
                    placeholder="새 메시지 입력..."
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                    className="message-input"
                    style={{
                      border: `2px solid ${currentTheme.primaryColor}`,
                      backgroundColor: currentTheme.backgroundColor,
                      color: currentTheme.textColor,
                    }}
                  />
                  <button
                    onClick={() => addMessage(key)}
                    className="add-button"
                    style={{
                      backgroundColor: currentTheme.primaryColor,
                      color: currentTheme.backgroundColor,
                    }}
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewMessage("");
                    }}
                    className="cancel-button"
                    style={{
                      border: `2px solid ${currentTheme.primaryColor}`,
                      backgroundColor: currentTheme.backgroundColor,
                      color: currentTheme.textColor,
                    }}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingCategory(key)}
                  className="start-add-button"
                  style={{
                    border: `2px solid ${currentTheme.primaryColor}`,
                    backgroundColor: currentTheme.backgroundColor,
                    color: currentTheme.primaryColor,
                  }}
                >
                  + 메시지 추가
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="messages-actions">
          <button
            onClick={handleClose}
            className="messages-button-close"
            style={{
              backgroundColor: currentTheme.accentColor,
              color: "white",
            }}
          >
            ✕ 닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
