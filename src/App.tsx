import { useState, useEffect, useRef } from "react";
import { usePomodoro, DEBUG_MODE } from "./hooks/usePomodoro";
import { useNotification } from "./hooks/useNotification";
import { useSound } from "./hooks/useSound";
import { CelebrationModal } from "./components/CelebrationModal";
import { CustomAlert } from "./components/CustomAlert";
import SpeechBubble from "./components/SpeechBubble";
import MediaRenderer from "./components/MediaRenderer";
import { getTheme } from "./utils/themes";
import { getRandomMessage } from "./data/messages";
import { MessageType } from "./types";
import {
  saveImageToIndexedDB,
  loadImageFromIndexedDB,
} from "./utils/imageStorage";
import "./styles/App.css";
import "./styles/AppComponent.css";

function App() {
  const {
    state,
    start,
    pause,
    reset,
    skipSession,
    updateSettings,
    formatTime,
  } = usePomodoro();
  const { notify } = useNotification();
  const { playWorkComplete, playBreakComplete, playCoinSound } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem("themeId") || "sakura";
  });
  const [currentMessage, setCurrentMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [workImageData, setWorkImageData] = useState<string>("");
  const [breakImageData, setBreakImageData] = useState<string>("");
  const progressIntervalRef = useRef<number | null>(null);
  const lastSessionTypeRef = useRef<string>(state.currentSessionType);
  const lastIsRunningRef = useRef<boolean>(state.isRunning);
  const lastTimeRemainingRef = useRef<number>(state.timeRemaining);

  const currentTheme = getTheme(currentThemeId);
  const isRunning = state.isRunning;

  // 앱 시작 시 기존 localStorage 이미지를 IndexedDB로 마이그레이션
  useEffect(() => {
    const migrateImages = async () => {
      try {
        const savedSettings = localStorage.getItem("pomodoroSettings");
        if (!savedSettings) return;

        const settings = JSON.parse(savedSettings);
        let needsUpdate = false;

        // work 이미지 마이그레이션
        if (
          settings.workCharacterImage &&
          settings.workCharacterImage.startsWith("data:")
        ) {
          console.log("[Migration] Moving work image to IndexedDB");
          await saveImageToIndexedDB(
            "work",
            settings.workCharacterImage,
            settings.workCharacterImageType || "image/png"
          );
          // base64 데이터는 삭제하되, 키는 유지
          delete settings.workCharacterImage;
          settings.workCharacterImageKey = "work";
          needsUpdate = true;
        } else if (
          !settings.workCharacterImageKey &&
          settings.workCharacterImageType
        ) {
          // 타입은 있는데 키가 없는 경우 (마이그레이션 실패 케이스)
          settings.workCharacterImageKey = "work";
          needsUpdate = true;
        }

        // break 이미지 마이그레이션
        if (
          settings.breakCharacterImage &&
          settings.breakCharacterImage.startsWith("data:")
        ) {
          console.log("[Migration] Moving break image to IndexedDB");
          await saveImageToIndexedDB(
            "break",
            settings.breakCharacterImage,
            settings.breakCharacterImageType || "image/png"
          );
          // base64 데이터는 삭제하되, 키는 유지
          delete settings.breakCharacterImage;
          settings.breakCharacterImageKey = "break";
          needsUpdate = true;
        } else if (
          !settings.breakCharacterImageKey &&
          settings.breakCharacterImageType
        ) {
          // 타입은 있는데 키가 없는 경우 (마이그레이션 실패 케이스)
          settings.breakCharacterImageKey = "break";
          needsUpdate = true;
        }

        // localStorage 업데이트
        if (needsUpdate) {
          console.log("[Migration] Updating localStorage");
          localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
        }
      } catch (error) {
        console.error("[Migration] Failed to migrate images:", error);
      }
    };

    migrateImages();
  }, []);

  // IndexedDB에서 이미지 로드
  useEffect(() => {
    const loadImages = async () => {
      try {
        console.log("[App] Loading images from IndexedDB...");
        const workImage = await loadImageFromIndexedDB("work");
        console.log("[App] Work image loaded:", workImage ? "YES" : "NO");
        if (workImage) {
          setWorkImageData(workImage.dataUrl);
          console.log(
            "[App] Work image data set, length:",
            workImage.dataUrl.length
          );
        }

        const breakImage = await loadImageFromIndexedDB("break");
        console.log("[App] Break image loaded:", breakImage ? "YES" : "NO");
        if (breakImage) {
          setBreakImageData(breakImage.dataUrl);
          console.log(
            "[App] Break image data set, length:",
            breakImage.dataUrl.length
          );
        }
      } catch (error) {
        console.error("[App] Failed to load images from IndexedDB:", error);
      }
    };

    loadImages();
  }, []);

  // settings 변경 감지하여 이미지 리로드
  useEffect(() => {
    const handleSettingsChange = async () => {
      try {
        const workImage = await loadImageFromIndexedDB("work");
        setWorkImageData(workImage?.dataUrl || "");

        const breakImage = await loadImageFromIndexedDB("break");
        setBreakImageData(breakImage?.dataUrl || "");
      } catch (error) {
        console.error("[App] Failed to reload images:", error);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "settingsChanged" || e.key === "pomodoroSettings") {
        handleSettingsChange();
      }
    };

    globalThis.addEventListener("storage", handleStorageChange);
    return () => globalThis.removeEventListener("storage", handleStorageChange);
  }, []);

  // 앱 시작 시 저장된 배율과 always on top 설정 적용
  useEffect(() => {
    const initializeWindow = async () => {
      try {
        const savedSettings = localStorage.getItem("pomodoroSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const scale = settings.sizeScale ?? 1;
          const baseWidth = 300;
          const baseHeight = 180;
          const newWidth = baseWidth * scale;
          const newHeight = baseHeight * scale;
          const alwaysOnTop = settings.alwaysOnTop !== false;

          const { getCurrentWindow, LogicalSize } = await import(
            "@tauri-apps/api/window"
          );
          const window = getCurrentWindow();
          await window.setSize(new LogicalSize(newWidth, newHeight));
          await window.setAlwaysOnTop(alwaysOnTop);
        }
      } catch {
        // Failed to initialize window
      }
    };

    initializeWindow();
  }, []);

  // 메시지를 표시하는 함수
  const showCharacterMessage = (type: MessageType, duration = 3000) => {
    const message = getRandomMessage(type);
    setCurrentMessage(message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  };

  // 세션 타입과 실행 상태 변경 감지
  useEffect(() => {
    const sessionTypeChanged =
      lastSessionTypeRef.current !== state.currentSessionType;

    // 업무 시작
    if (
      state.currentSessionType === "work" &&
      state.isRunning &&
      !lastIsRunningRef.current
    ) {
      showCharacterMessage("workStart");
    }

    // 업무 완료 (세션 타입이 break로 변경되었을 때)
    if (
      sessionTypeChanged &&
      state.currentSessionType === "break" &&
      lastSessionTypeRef.current === "work"
    ) {
      showCharacterMessage("workComplete");
      // 타이머가 자연스럽게 완료된 경우에만 소리 재생 (skip으로 넘긴 경우 제외)
      const wasNaturalCompletion = lastTimeRemainingRef.current === 0;
      // 업무 완료 벨소리 재생
      if (state.settings.soundEnabled !== false && wasNaturalCompletion) {
        playWorkComplete(state.settings.volume ?? 50);
      }
    }

    // 휴식 완료 (세션 타입이 work로 변경되었을 때)
    if (
      sessionTypeChanged &&
      state.currentSessionType === "work" &&
      lastSessionTypeRef.current === "break"
    ) {
      // 타이머가 자연스럽게 완료된 경우에만 소리 재생
      const wasNaturalCompletion = lastTimeRemainingRef.current === 0;
      // 휴식 완료 벨소리 재생
      if (state.settings.soundEnabled !== false && wasNaturalCompletion) {
        playBreakComplete(state.settings.volume ?? 50);
      }
    }

    lastSessionTypeRef.current = state.currentSessionType;
    lastIsRunningRef.current = state.isRunning;
    lastTimeRemainingRef.current = state.timeRemaining;
  }, [
    state.currentSessionType,
    state.isRunning,
    state.timeRemaining,
    state.settings.soundEnabled,
    state.settings.volume,
    playWorkComplete,
    playBreakComplete,
  ]);

  // 업무 중 주기적 메시지 (디버깅: 5초, 실제: 5분)
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (state.isRunning && state.currentSessionType === "work") {
      // 디버그 모드: 5초마다, 실제: 5분마다 메시지 표시
      const intervalTime = DEBUG_MODE ? 5 * 1000 : 5 * 60 * 1000;

      progressIntervalRef.current = globalThis.setInterval(() => {
        showCharacterMessage("workProgress");
      }, intervalTime);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [state.isRunning, state.currentSessionType]);

  useEffect(() => {
    const handleSessionComplete = (event: CustomEvent) => {
      const { completedSessions, dailyGoal } = event.detail;

      // 목표 달성 시 정확히 목표 세션 수와 일치할 때만 알림 표시
      if (completedSessions === dailyGoal) {
        const message = getRandomMessage("goalAchieved");
        setShowCelebration(true);
        notify("목표 달성!", message);
        // 목표 달성 시 coin05.mp3 재생 (30% 볼륨)
        if (state.settings.soundEnabled !== false) {
          playCoinSound(30);
        }
      }
    };

    const handleCycleComplete = () => {
      // 사이클 완료 알림 표시 (업무 완료 메시지 중 랜덤 선택)
      const message = getRandomMessage("workComplete");
      notify("사이클 완료!", message);

      // 사이클 완료 시 work 완료 벨소리 재생
      if (state.settings.soundEnabled !== false) {
        playWorkComplete(state.settings.volume ?? 50);
      }
    };

    globalThis.addEventListener(
      "sessionComplete",
      handleSessionComplete as EventListener
    );
    globalThis.addEventListener(
      "cycleComplete",
      handleCycleComplete as EventListener
    );

    return () => {
      globalThis.removeEventListener(
        "sessionComplete",
        handleSessionComplete as EventListener
      );
      globalThis.removeEventListener(
        "cycleComplete",
        handleCycleComplete as EventListener
      );
    };
  }, [
    notify,
    playCoinSound,
    playWorkComplete,
    state.settings.soundEnabled,
    state.settings.volume,
  ]);

  // localStorage 변경 감지 (설정 창에서 저장했을 때)
  useEffect(() => {
    const lastChangeKey = "settingsChanged";
    const resetKey = "pomodoroReset";
    let lastChangeTime = localStorage.getItem(lastChangeKey) || "0";
    let lastResetTime = localStorage.getItem(resetKey) || "0";

    const handleReset = (currentResetTime: string) => {
      if (currentResetTime !== lastResetTime) {
        lastResetTime = currentResetTime;
        globalThis.location.reload();
        return true;
      }
      return false;
    };

    const updateWindowSettings = async (
      newScale: number,
      currentScale: number,
      newAlwaysOnTop: boolean,
      currentAlwaysOnTop: boolean
    ) => {
      if (newScale === currentScale && newAlwaysOnTop === currentAlwaysOnTop) {
        return;
      }

      try {
        const { getCurrentWindow, LogicalSize } = await import(
          "@tauri-apps/api/window"
        );
        const window = getCurrentWindow();

        if (newScale !== currentScale) {
          const baseWidth = 300;
          const baseHeight = 180;
          await window.setSize(
            new LogicalSize(baseWidth * newScale, baseHeight * newScale)
          );
        }

        if (newAlwaysOnTop !== currentAlwaysOnTop) {
          await window.setAlwaysOnTop(newAlwaysOnTop);
        }
      } catch {
        // Failed to update window settings
      }
    };

    const handleSettingsUpdate = async (savedSettings: string) => {
      try {
        const settings = JSON.parse(savedSettings);
        const newScale = settings.sizeScale ?? 1;
        const newAlwaysOnTop = settings.alwaysOnTop !== false;
        const currentScale = state.settings.sizeScale ?? 1;
        const currentAlwaysOnTop = state.settings.alwaysOnTop !== false;

        updateSettings(settings);
        await updateWindowSettings(
          newScale,
          currentScale,
          newAlwaysOnTop,
          currentAlwaysOnTop
        );
      } catch {
        // Failed to parse settings
      }
    };

    const checkSettingsChange = async () => {
      const currentChangeTime = localStorage.getItem(lastChangeKey) || "0";
      const currentResetTime = localStorage.getItem(resetKey) || "0";

      if (handleReset(currentResetTime)) {
        return;
      }

      if (currentChangeTime !== lastChangeTime) {
        lastChangeTime = currentChangeTime;

        const savedSettings = localStorage.getItem("pomodoroSettings");
        const savedTheme = localStorage.getItem("themeId");

        if (savedSettings) {
          await handleSettingsUpdate(savedSettings);
        }

        if (savedTheme) {
          setCurrentThemeId(savedTheme);
        }
      }
    };

    const interval = setInterval(checkSettingsChange, 100);

    return () => clearInterval(interval);
  }, [updateSettings, state.settings.sizeScale, state.settings.alwaysOnTop]);

  const handleOpenSettings = async () => {
    try {
      const alwaysOnTop = state.settings.alwaysOnTop !== false;
      // 동적으로 invoke 함수를 import
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_settings_window", { alwaysOnTop });
    } catch {
      setAlertMessage("설정 창을 열 수 없습니다.");
      setShowAlert(true);
    }
  };

  const handleClose = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      // 앱 전체 종료
      await invoke("quit_app");
    } catch (error) {
      console.error("Failed to quit app:", error);
    }
  };

  const handleOpenMessages = async () => {
    try {
      const alwaysOnTop = state.settings.alwaysOnTop !== false;
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_messages_window", { alwaysOnTop });
    } catch (error) {
      console.error("Failed to open messages window:", error);
      setAlertMessage("메시지 설정 창을 열 수 없습니다.");
      setShowAlert(true);
    }
  };

  const handleImageClick = () => {
    // 흔들림 애니메이션 트리거
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // 클릭 메시지 표시
    showCharacterMessage("imageClick", 2000);
  };

  const sizeScale = state.settings.sizeScale ?? 1;
  const fontFamily = state.settings.fontFamily ?? "GMarketSans";

  return (
    <div
      className="app-container"
      style={{
        fontFamily: `${fontFamily}, sans-serif`,
        transform: `scale(${sizeScale})`,
        transformOrigin: "top left",
        width: `${100 / sizeScale}%`,
        height: `${100 / sizeScale}%`,
      }}
    >
      <div
        className="widget-card"
        style={{
          backgroundColor: currentTheme.backgroundColor,
          color: currentTheme.textColor,
          padding: "0",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* 드래그 영역 */}
        <div data-tauri-drag-region className="drag-region drag-header">
          <button
            type="button"
            onClick={handleOpenMessages}
            onMouseDown={(e) => e.stopPropagation()}
            className="messages-button"
            style={{ background: currentTheme.secondaryColor }}
            title="메시지 설정"
          >
            🗨️
          </button>

          <button
            type="button"
            onClick={handleOpenSettings}
            onMouseDown={(e) => e.stopPropagation()}
            className="apps-settings-button"
            style={{ background: currentTheme.secondaryColor }}
            title="설정"
          >
            ⚙️
          </button>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="close-button"
            style={{ background: currentTheme.accentColor }}
            title="닫기"
          >
            ✖
          </button>
        </div>

        <div className="main-content">
          {/* 캐릭터 이미지 영역 */}
          <div style={{ position: "relative" }}>
            <SpeechBubble
              message={currentMessage}
              theme={currentTheme}
              visible={showMessage}
            />
            <button
              className="character-image-container"
              onClick={handleImageClick}
              aria-label="캐릭터 이미지"
              style={{
                cursor: "pointer",
                border: "none",
                background: "none",
                padding: 0,
              }}
              type="button"
            >
              {(() => {
                const animationEnabled =
                  state.settings.animationEnabled !== false;
                const animationClass = `${
                  animationEnabled ? "float-animation" : ""
                } ${isShaking ? "shake-animation" : ""}`;

                if (state.currentSessionType === "work" && workImageData) {
                  return (
                    <MediaRenderer
                      src={workImageData}
                      fileType={state.settings.workCharacterImageType}
                      alt="Work Character"
                      className={`character-image ${animationClass}`}
                    />
                  );
                }

                if (state.currentSessionType === "break" && breakImageData) {
                  return (
                    <MediaRenderer
                      src={breakImageData}
                      fileType={state.settings.breakCharacterImageType}
                      alt="Break Character"
                      className={`character-image ${animationClass}`}
                    />
                  );
                }

                return (
                  <span className={animationClass}>
                    {state.currentSessionType === "work" ? "🔥" : "☕"}
                  </span>
                );
              })()}
            </button>
          </div>

          {/* 정보 영역 */}
          <div className="info-section">
            {/* 타이머 */}
            <div className="timer-container">
              <div
                className="timer-label"
                style={{ color: currentTheme.accentColor }}
              >
                {state.currentSessionType === "work" ? "FOCUS" : "BREAK"}
              </div>
              <div
                className="timer-display"
                style={{ color: currentTheme.primaryColor }}
              >
                {formatTime(state.timeRemaining)}
              </div>
            </div>

            {/* 진행도 바 */}
            <div className="progress-container">
              <div
                className="progress-label"
                style={{ color: currentTheme.textColor }}
              >
                <span>목표</span>
                <span>
                  {state.completedSessions}/{state.settings.dailyGoal}
                </span>
              </div>
              <div
                className="progress-bar-bg"
                style={{ backgroundColor: currentTheme.secondaryColor }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(
                      (state.completedSessions / state.settings.dailyGoal) *
                        100,
                      100
                    )}%`,
                    backgroundColor: currentTheme.accentColor,
                  }}
                ></div>
              </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="controls-container">
              <button
                onClick={isRunning ? pause : start}
                className="control-button control-button-primary"
                style={{ backgroundColor: currentTheme.accentColor }}
              >
                {isRunning ? "⏸" : "▶"}
              </button>
              <button
                onClick={reset}
                className="control-button"
                style={{
                  backgroundColor: currentTheme.secondaryColor,
                  color: currentTheme.textColor,
                }}
              >
                ⟳
              </button>
              <button
                onClick={skipSession}
                className="control-button"
                style={{
                  backgroundColor: currentTheme.secondaryColor,
                  color: currentTheme.textColor,
                }}
              >
                ⏭
              </button>
            </div>

            {/* 통계 */}
            <div
              className="stats-container"
              style={{ color: currentTheme.textColor }}
            >
              <span>사이클 {state.currentCycle}</span>
              <span>•</span>
              <span>완료 {state.completedSessions}회</span>
            </div>
          </div>
        </div>
      </div>

      <CelebrationModal
        show={showCelebration}
        completedSessions={state.completedSessions}
        dailyGoal={state.settings.dailyGoal}
        theme={currentTheme}
        onClose={() => setShowCelebration(false)}
      />

      <CustomAlert
        show={showAlert}
        message={alertMessage}
        theme={currentTheme}
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
}

export default App;
