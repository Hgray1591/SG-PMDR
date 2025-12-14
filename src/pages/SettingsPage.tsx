import imageCompression from "browser-image-compression";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PomodoroSettings } from "../types";
import { themes, getTheme } from "../utils/themes";
import { DEBUG_MODE } from "../hooks/usePomodoro";
import { CustomAlert } from "../components/CustomAlert";
import MediaRenderer from "../components/MediaRenderer";
import {
  saveImageToIndexedDB,
  loadImageFromIndexedDB,
  deleteImageFromIndexedDB,
} from "../utils/imageStorage";
import "../styles/App.css";
import "../styles/Settings.css";

const SettingsPage = () => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // shouldAnimate 상태 변경 로그
  useEffect(() => {
    console.log("[Settings] shouldAnimate changed to:", shouldAnimate);
  }, [shouldAnimate]);
  const [settings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem("pomodoroSettings");
    return saved
      ? JSON.parse(saved)
      : {
          workTime: 25,
          breakTime: 5,
          sessionsPerCycle: 4,
          dailyGoal: 8,
        };
  });

  // 초기 이미지 상태를 추적 (IndexedDB에서 로드한 것인지 새로 업로드한 것인지 구분)
  const [initialWorkImage, setInitialWorkImage] = useState("");
  const [initialBreakImage, setInitialBreakImage] = useState("");

  // IndexedDB에서 이미지 로드 (최초 마운트 시)
  useEffect(() => {
    const loadImages = async () => {
      try {
        console.log("[SettingsPage] Loading images from IndexedDB...");
        const workImage = await loadImageFromIndexedDB("work");
        console.log("[SettingsPage] Work image loaded:", workImage ? "YES" : "NO");
        if (workImage) {
          setWorkCharacterImage(workImage.dataUrl);
          setWorkCharacterImageType(workImage.fileType);
          setInitialWorkImage(workImage.dataUrl);
          savedWorkImageRef.current = workImage.dataUrl;
          console.log("[SettingsPage] Work image set, length:", workImage.dataUrl.length);
        }

        const breakImage = await loadImageFromIndexedDB("break");
        console.log("[SettingsPage] Break image loaded:", breakImage ? "YES" : "NO");
        if (breakImage) {
          setBreakCharacterImage(breakImage.dataUrl);
          setBreakCharacterImageType(breakImage.fileType);
          setInitialBreakImage(breakImage.dataUrl);
          savedBreakImageRef.current = breakImage.dataUrl;
          console.log("[SettingsPage] Break image set, length:", breakImage.dataUrl.length);
        }
      } catch (error) {
        console.error("Failed to load images from IndexedDB:", error);
      }
    };

    loadImages();
  }, []);

  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem("themeId") || "sakura";
  });
  const [initialThemeId, setInitialThemeId] = useState(
    localStorage.getItem("themeId") || "sakura"
  );

  // 창이 표시될 때마다 애니메이션 활성화 및 테마 리셋
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
        unlistenFn = await listen("settings-window-shown", async () => {
          console.log("[Settings] window-shown event received");
          // 이벤트가 여러 번 와도 true로 덮어씌우면 React가 렌더링을 건너뛰므로 깜빡이지 않음
          setShouldAnimate(true);

          // 창이 다시 열릴 때 저장된 테마와 폰트로 리셋
          const savedThemeId = localStorage.getItem("themeId") || "sakura";
          setThemeId(savedThemeId);
          setInitialThemeId(savedThemeId);

          const savedSettings = localStorage.getItem("pomodoroSettings");
          if (savedSettings) {
            try {
              const settings = JSON.parse(savedSettings);
              const savedFont = settings.fontFamily || "GMarketSans";
              setFontFamily(savedFont);
              setInitialFontFamily(savedFont);
            } catch {
              setFontFamily("GMarketSans");
              setInitialFontFamily("GMarketSans");
            }
          }

          // ref에 저장된 이미지로 리셋 (localStorage의 테마/폰트처럼)
          console.log("[Settings] Resetting images to saved state");
          setWorkCharacterImage(savedWorkImageRef.current);
          setBreakCharacterImage(savedBreakImageRef.current);
          setInitialWorkImage(savedWorkImageRef.current);
          setInitialBreakImage(savedBreakImageRef.current);
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

  const [workTime, setWorkTime] = useState(settings.workTime);
  const [breakTime, setBreakTime] = useState(settings.breakTime);
  const [sessionsPerCycle, setSessionsPerCycle] = useState(
    settings.sessionsPerCycle
  );
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal);

  // 이미지 상태를 저장하는 ref (초기값 저장용)
  const savedWorkImageRef = useRef<string>("");
  const savedBreakImageRef = useRef<string>("");

  // 이미지는 빈 값으로 시작하고 useEffect에서 로드
  const [workCharacterImage, setWorkCharacterImage] = useState("");
  const [workCharacterImageType, setWorkCharacterImageType] = useState(
    settings.workCharacterImageType || ""
  );
  const [breakCharacterImage, setBreakCharacterImage] = useState("");
  const [breakCharacterImageType, setBreakCharacterImageType] = useState(
    settings.breakCharacterImageType || ""
  );
  const [animationEnabled, setAnimationEnabled] = useState(
    settings.animationEnabled !== false
  );
  const [soundEnabled, setSoundEnabled] = useState(
    settings.soundEnabled !== false
  );
  const [volume, setVolume] = useState(settings.volume ?? 30);
  const [sizeScale, setSizeScale] = useState(settings.sizeScale ?? 1);
  const [fontFamily, setFontFamily] = useState(
    settings.fontFamily ?? "GMarketSans"
  );
  const [initialFontFamily, setInitialFontFamily] = useState(
    settings.fontFamily ?? "GMarketSans"
  );
  const [alwaysOnTop, setAlwaysOnTop] = useState(
    settings.alwaysOnTop !== false
  );
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const currentTheme = getTheme(themeId);

  const handleResetConfirm = () => {
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        state.completedSessions = 0;
        state.currentCycle = 0;
        localStorage.setItem("pomodoroState", JSON.stringify(state));

        globalThis.dispatchEvent(
          new StorageEvent("storage", {
            key: "pomodoroState",
            newValue: JSON.stringify(state),
            url: globalThis.location.href,
            storageArea: localStorage,
          })
        );
      } catch {
        // Failed to reset completed sessions
      }
    }

    const today = new Date().toDateString();
    localStorage.setItem("lastResetDate", today);
    localStorage.setItem("pomodoroReset", Date.now().toString());
    setShowResetConfirm(false);
    setAlertMessage("완료 횟수와 사이클이 초기화되었습니다.");
    setShowAlert(true);
  };

  // 미리 정의된 폰트 목록
  const predefinedFonts = [
    "GMarketSans",
    "Cafe24ProSlim",
    "BookkMyungjo",
    "zenSerif",
    "kkukkukk",
    "KkuBulLim",
    "RoundedFixedsys",
    "ThinRounded",
  ];

  // APNG 파일인지 확인 (acTL 청크 존재 여부)
  const isAPNG = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        // PNG 시그니처 확인
        if (
          arr[0] !== 0x89 ||
          arr[1] !== 0x50 ||
          arr[2] !== 0x4e ||
          arr[3] !== 0x47
        ) {
          resolve(false);
          return;
        }
        // acTL 청크 찾기 (APNG의 표시)
        const str = String.fromCharCode.apply(null, Array.from(arr));
        resolve(str.indexOf("acTL") !== -1);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 4096)); // 처음 4KB만 읽음
    });
  };

  // 애니메이션 가능한 포맷인지 확인
  const isAnimatedFormat = (fileType: string) => {
    return ["image/gif", "image/apng", "video/webm"].includes(fileType);
  };

  const processImageFile = async (
    file: File,
    type: "work" | "break",
    forceType?: string
  ) => {
    const reader = new FileReader();

    reader.onerror = () => {
      setAlertMessage("파일을 읽는 중 오류가 발생했습니다.");
      setShowAlert(true);
    };

    reader.onload = async (e) => {
      const result = e.target?.result as string;

      try {
        // 파일 타입 결정 (forceType > 실제 파일 타입)
        let actualFileType = forceType || file.type;

        // State만 업데이트 (미리보기용)
        // 실제 저장은 handleSave에서 수행
        if (type === "work") {
          setWorkCharacterImage(result);
          setWorkCharacterImageType(actualFileType);
        } else {
          setBreakCharacterImage(result);
          setBreakCharacterImageType(actualFileType);
        }
      } catch (error) {
        console.error("Failed to process image:", error);
        setAlertMessage("파일 처리 중 오류가 발생했습니다.");
        setShowAlert(true);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleAnimatedImageUpload = (
    file: File,
    type: "work" | "break",
    forceType?: string
  ) => {
    console.log("[handleAnimatedImageUpload]", {
      name: file.name,
      type: file.type,
      forceType,
      size: file.size,
    });

    const maxSizeMB = 10;
    if (file.size / 1024 / 1024 > maxSizeMB) {
      setAlertMessage(
        `파일이 너무 큽니다. ${maxSizeMB}MB 이하만 허용됩니다.`
      );
      setShowAlert(true);
      return false;
    }
    processImageFile(file, type, forceType);
    return true;
  };

  const handleImageUpload = async (file: File, type: "work" | "break") => {
    console.log("[handleImageUpload]", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // GIF, WebM은 바로 처리
    if (isAnimatedFormat(file.type)) {
      handleAnimatedImageUpload(file, type);
      return;
    }

    // PNG인 경우 APNG인지 확인
    if (file.type === "image/png") {
      const isAnimated = await isAPNG(file);
      console.log("[handleImageUpload] PNG 파일 APNG 여부:", isAnimated);
      if (isAnimated) {
        // APNG는 압축하지 않고 직접 처리 (타입을 image/apng로 강제)
        handleAnimatedImageUpload(file, type, "image/apng");
        return;
      }
    }

    // 정적 PNG/JPG는 압축
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      processImageFile(compressedFile, type);
    } catch {
      setAlertMessage("이미지 압축에 실패했습니다.");
      setShowAlert(true);
    }
  };

  const handleThemeChange = (newThemeId: string) => {
    setThemeId(newThemeId);
    localStorage.setItem("themeId", newThemeId);
    localStorage.setItem("settingsChanged", Date.now().toString());
  };

  const handleSave = async () => {
    try {
      // work 이미지 처리
      if (workCharacterImage && workCharacterImage !== initialWorkImage) {
        // 새로 업로드한 이미지거나 변경된 경우
        console.log("[handleSave] Saving work image to IndexedDB");
        await saveImageToIndexedDB("work", workCharacterImage, workCharacterImageType || "image/png");
        setInitialWorkImage(workCharacterImage);
        savedWorkImageRef.current = workCharacterImage;
      } else if (!workCharacterImage && initialWorkImage) {
        // 이미지가 삭제된 경우
        console.log("[handleSave] Deleting work image from IndexedDB");
        await deleteImageFromIndexedDB("work");
        setInitialWorkImage("");
        savedWorkImageRef.current = "";
      }

      // break 이미지 처리
      if (breakCharacterImage && breakCharacterImage !== initialBreakImage) {
        // 새로 업로드한 이미지거나 변경된 경우
        console.log("[handleSave] Saving break image to IndexedDB");
        await saveImageToIndexedDB("break", breakCharacterImage, breakCharacterImageType || "image/png");
        setInitialBreakImage(breakCharacterImage);
        savedBreakImageRef.current = breakCharacterImage;
      } else if (!breakCharacterImage && initialBreakImage) {
        // 이미지가 삭제된 경우
        console.log("[handleSave] Deleting break image from IndexedDB");
        await deleteImageFromIndexedDB("break");
        setInitialBreakImage("");
        savedBreakImageRef.current = "";
      }
    } catch (error) {
      console.error("Failed to save images to IndexedDB:", error);
      setAlertMessage("이미지 저장 중 오류가 발생했습니다.");
      setShowAlert(true);
      return;
    }

    const newSettings = {
      workTime,
      breakTime,
      sessionsPerCycle,
      dailyGoal,
      // 이미지 데이터는 저장하지 않음 (IndexedDB에 이미 저장됨)
      workCharacterImageType,
      workCharacterImageKey: workCharacterImage ? "work" : undefined,
      breakCharacterImageType,
      breakCharacterImageKey: breakCharacterImage ? "break" : undefined,
      animationEnabled,
      soundEnabled,
      volume,
      sizeScale,
      fontFamily,
      alwaysOnTop,
    };

    console.log("[handleSave] Saving settings to localStorage:", newSettings);
    localStorage.setItem("pomodoroSettings", JSON.stringify(newSettings));
    localStorage.setItem("themeId", themeId);
    localStorage.setItem("settingsChanged", Date.now().toString());

    // 저장된 테마와 폰트를 초기값으로 설정
    setInitialThemeId(themeId);
    setInitialFontFamily(fontFamily);

    // alwaysOnTop 설정 변경을 모든 창에 적용
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_always_on_top", { alwaysOnTop });
    } catch (error) {
      console.error("Failed to set always on top:", error);
    }

    // 애니메이션 리셋
    setShouldAnimate(false);

    // Tauri API로 창 숨기기 (닫지 않음)
    try {
      const { getCurrentWebviewWindow } = await import(
        "@tauri-apps/api/webviewWindow"
      );
      const window = getCurrentWebviewWindow();
      await window.hide();
    } catch {
      // Failed to hide window
    }
  };

  const handleCancel = async () => {
    // 폰트가 변경되었다면 원래 폰트로 되돌림
    if (fontFamily !== initialFontFamily) {
      setFontFamily(initialFontFamily);
      const revertSettings = {
        ...settings,
        fontFamily: initialFontFamily,
      };
      localStorage.setItem("pomodoroSettings", JSON.stringify(revertSettings));
      localStorage.setItem("settingsChanged", Date.now().toString());
    }

    // 테마가 변경되었다면 원래 테마로 되돌림
    if (themeId !== initialThemeId) {
      setThemeId(initialThemeId);
      localStorage.setItem("themeId", initialThemeId);
      localStorage.setItem("settingsChanged", Date.now().toString());
    }

    // 애니메이션 리셋
    setShouldAnimate(false);

    try {
      const { getCurrentWebviewWindow } = await import(
        "@tauri-apps/api/webviewWindow"
      );
      const window = getCurrentWebviewWindow();
      await window.hide();
    } catch {
      // Failed to hide window
    }
  };

  return (
    <div
      className={`settings-modal ${shouldAnimate ? "animate" : ""}`}
      style={{
        backgroundColor: currentTheme.backgroundColor,
        border: `3px solid ${currentTheme.primaryColor}`,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: "25px",
        borderRadius: "15px",
        boxSizing: "border-box",
        fontFamily: fontFamily,
      }}
      data-tauri-drag-region
    >
      <h2
        className="settings-header"
        style={{ color: currentTheme.accentColor }}
      >
        ⚙️ 설정
      </h2>

      <div className="settings-section">
        <h3
          className="settings-section-title"
          style={{ color: currentTheme.primaryColor }}
        >
          타이머 설정
        </h3>

        <div className="timer-settings-container">
          <div
            className="settings-label"
            style={{ color: currentTheme.textColor }}
          >
            <span
              title={
                DEBUG_MODE
                  ? "집중 시간 (초)"
                  : "집중 시간은 한 세션 동안 집중해서 작업하는 시간을 분 단위로 설정합니다."
              }
            >
              집중 시간{DEBUG_MODE ? " (초)" : ""}
            </span>

            <div className="number-input-wrapper">
              <input
                type="number"
                min="1"
                max="120"
                value={workTime}
                onChange={(e) => setWorkTime(Number(e.target.value))}
                className="settings-input"
                style={{
                  border: `2px solid ${currentTheme.primaryColor}`,
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.textColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 4px ${currentTheme.primaryColor}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {/* 커스텀 spin buttons */}
              <div
                className="spin-buttons"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <button
                  className="spin-up"
                  onClick={() => setWorkTime(workTime + 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▲
                </button>
                <button
                  className="spin-down"
                  onClick={() => setWorkTime(workTime - 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          <div
            className="settings-label"
            style={{ color: currentTheme.textColor }}
          >
            <span
              title={
                DEBUG_MODE
                  ? "휴식 시간 (초)"
                  : "휴식 시간은 한 세션 동안 휴식하는 시간을 분 단위로 설정합니다."
              }
            >
              휴식 시간{DEBUG_MODE ? " (초)" : ""}
            </span>
            <div className="number-input-wrapper">
              <input
                type="number"
                min="1"
                max="60"
                value={breakTime}
                onChange={(e) => setBreakTime(Number(e.target.value))}
                className="settings-input"
                style={{
                  border: `2px solid ${currentTheme.primaryColor}`,
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.textColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 4px ${currentTheme.primaryColor}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {/* 커스텀 spin buttons */}
              <div
                className="spin-buttons"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <button
                  className="spin-up"
                  onClick={() => setBreakTime(breakTime + 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▲
                </button>
                <button
                  className="spin-down"
                  onClick={() => setBreakTime(breakTime - 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          <div
            className="settings-label"
            style={{ color: currentTheme.textColor }}
          >
            <span title="세션 반복 수는 한 사이클 내에서 연속으로 진행되는 업무-휴식 쌍의 수를 의미합니다.">
              세션 반복
            </span>

            <div className="number-input-wrapper">
              <input
                type="number"
                min="1"
                max="20"
                value={sessionsPerCycle}
                onChange={(e) => setSessionsPerCycle(Number(e.target.value))}
                className="settings-input"
                style={{
                  border: `2px solid ${currentTheme.primaryColor}`,
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.textColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 4px ${currentTheme.primaryColor}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {/* 커스텀 spin buttons */}
              <div
                className="spin-buttons"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <button
                  className="spin-up"
                  onClick={() => setSessionsPerCycle(sessionsPerCycle + 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▲
                </button>
                <button
                  className="spin-down"
                  onClick={() => setSessionsPerCycle(sessionsPerCycle - 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          <div
            className="settings-label"
            style={{ color: currentTheme.textColor }}
          >
            <span title="목표 세션은 하루 동안 달성하고자 하는 세션 수를 의미합니다.">
              목표 세션
            </span>

            <div className="number-input-wrapper">
              <input
                type="number"
                min="1"
                max="20"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="settings-input"
                style={{
                  border: `2px solid ${currentTheme.primaryColor}`,
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.textColor,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 4px ${currentTheme.primaryColor}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {/* 커스텀 spin buttons */}
              <div
                className="spin-buttons"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <button
                  className="spin-up"
                  onClick={() => setDailyGoal(dailyGoal + 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▲
                </button>
                <button
                  className="spin-down"
                  onClick={() => setDailyGoal(dailyGoal - 1)}
                  style={{
                    width: "18px",
                    height: "16px",
                    fontSize: "9px",
                    color: currentTheme.primaryColor,
                    backgroundColor: "rgba(0,0,0,0)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3
          className="settings-section-title"
          style={{ color: currentTheme.primaryColor }}
        >
          이미지 설정
        </h3>

        <div className="character-image-settings-container">
          <div className="character-image-section">
            <div
              className="character-image-label"
              style={{ color: currentTheme.textColor }}
            >
              업무 중
            </div>
            <div className="character-image-upload">
              <div
                className="character-image-preview"
                style={{ border: `2px solid ${currentTheme.primaryColor}` }}
              >
                {workCharacterImage && (
                  <MediaRenderer
                    src={workCharacterImage}
                    fileType={workCharacterImageType}
                    alt="Work Character Preview"
                  />
                )}
                {!workCharacterImage && (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      fontSize: "40px",
                      paddingBottom: "10px",
                      alignItems: "center",
                      justifyContent: "center",
                      display: "flex",
                      color: currentTheme.primaryColor,
                    }}
                  >
                    🔥
                  </div>
                )}
              </div>

              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept="image/gif,image/apng,image/png,image/jpeg,image/jpg,video/webm"
                  id="work-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "work");
                  }}
                />
                {/* 위 input은 숨기고, 아래에 커스텀 input 생성 */}
                <label
                  htmlFor="work-file-input"
                  className="file-upload-button"
                  style={{
                    backgroundColor: currentTheme.primaryColor,
                    color: currentTheme.backgroundColor,
                    border: `2px solid ${currentTheme.primaryColor}`,
                  }}
                >
                  {workCharacterImage ? "파일 변경" : "파일 선택"}
                </label>
                <button
                  className="file-remove-button"
                  style={{
                    width: workCharacterImage ? "25px" : "0px",
                    marginLeft: "2px",
                    backgroundColor: currentTheme.primaryColor,
                    color: currentTheme.backgroundColor,
                    border: `2px solid ${currentTheme.primaryColor}`,
                    borderRadius: "10px",
                    cursor: workCharacterImage ? "pointer" : "default",
                    pointerEvents: workCharacterImage ? "auto" : "none",
                    opacity: workCharacterImage ? 1 : 0,
                  }}
                  onClick={() => {
                    // State만 초기화 (실제 삭제는 저장 시)
                    setWorkCharacterImage("");
                    setWorkCharacterImageType("");
                  }}
                >
                  ⟳
                </button>
              </div>
            </div>
          </div>

          <div className="character-image-section">
            <div
              className="character-image-label"
              style={{ color: currentTheme.textColor }}
            >
              휴식 중
            </div>
            <div className="character-image-upload">
              <div
                className="character-image-preview"
                style={{ border: `2px solid ${currentTheme.primaryColor}` }}
              >
                {breakCharacterImage && (
                  <MediaRenderer
                    src={breakCharacterImage}
                    fileType={breakCharacterImageType}
                    alt="Break Character Preview"
                  />
                )}
                {!breakCharacterImage && (
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      fontSize: "40px",
                      paddingBottom: "10px",
                      alignItems: "center",
                      justifyContent: "center",
                      display: "flex",
                      color: currentTheme.primaryColor,
                    }}
                  >
                    ☕
                  </div>
                )}
              </div>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept="image/gif,image/apng,image/png,image/jpeg,image/jpg,video/webm"
                  id="break-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "break");
                  }}
                />
                {/* 위 input은 숨기고, 아래에 커스텀 input 생성 */}
                <label
                  htmlFor="break-file-input"
                  className="file-upload-button"
                  style={{
                    backgroundColor: currentTheme.primaryColor,
                    color: currentTheme.backgroundColor,
                    border: `2px solid ${currentTheme.primaryColor}`,
                  }}
                >
                  {breakCharacterImage ? "파일 변경" : "파일 선택"}
                </label>
                <button
                  className="file-remove-button"
                  style={{
                    width: breakCharacterImage ? "25px" : "0px",
                    marginLeft: "2px",
                    backgroundColor: currentTheme.primaryColor,
                    color: currentTheme.backgroundColor,
                    border: `2px solid ${currentTheme.primaryColor}`,
                    borderRadius: "10px",
                    cursor: breakCharacterImage ? "pointer" : "default",
                    pointerEvents: breakCharacterImage ? "auto" : "none",
                    opacity: breakCharacterImage ? 1 : 0,
                  }}
                  onClick={() => {
                    // State만 초기화 (실제 삭제는 저장 시)
                    setBreakCharacterImage("");
                    setBreakCharacterImageType("");
                  }}
                >
                  ⟳
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3
          className="settings-section-title"
          style={{ color: currentTheme.primaryColor }}
        >
          세부 설정
        </h3>

        <div
          className="settings-label"
          style={{
            color: currentTheme.textColor,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>항상 위에 표시</span>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            aria-label="항상 위에 표시"
          >
            <input
              type="checkbox"
              checked={alwaysOnTop}
              onChange={(e) => setAlwaysOnTop(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: currentTheme.accentColor,
              }}
              aria-label="항상 위에 표시"
            />
          </label>
        </div>

        <div
          className="settings-label"
          style={{
            color: currentTheme.textColor,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
          }}
        >
          <span>이미지 애니메이션</span>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            aria-label="이미지 애니메이션"
          >
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={(e) => setAnimationEnabled(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: currentTheme.accentColor,
              }}
              aria-label="이미지 애니메이션"
            />
          </label>
        </div>

        <div
          className="settings-label"
          style={{
            color: currentTheme.textColor,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
          }}
        >
          <span>효과음</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              style={{
                fontSize: "18px",
                cursor: "pointer",
                userSelect: "none",
                border: "none",
                background: "none",
                padding: 0,
              }}
              onClick={() => {
                if (volume === 0) {
                  setVolume(30);
                  setSoundEnabled(true);
                } else {
                  setVolume(0);
                  setSoundEnabled(false);
                }
              }}
              aria-label={volume === 0 ? "음소거" : "소리 켜짐"}
              title={volume === 0 ? "음소거" : "소리 켜짐"}
              type="button"
            >
              {volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const newVolume = Number(e.target.value);
                setVolume(newVolume);
                setSoundEnabled(newVolume > 0);
              }}
              style={{
                width: "120px",
                cursor: "pointer",
                accentColor: currentTheme.accentColor,
              }}
            />
            <span style={{ minWidth: "40px", textAlign: "right" }}>
              {volume}%
            </span>
          </div>
        </div>

        <div
          className="settings-label"
          style={{
            color: currentTheme.textColor,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
          }}
        >
          <span>화면 배율</span>
          <div
            className="scale-button-container"
            style={{ display: "flex", gap: "8px" }}
          >
            {[1, 1.25, 1.5, 2].map((scale) => (
              <button
                key={scale}
                onClick={() => setSizeScale(scale)}
                style={{
                  width: "45px",
                  padding: "4px 0",
                  borderRadius: "6px",
                  border: `2px solid ${
                    sizeScale === scale
                      ? currentTheme.accentColor
                      : currentTheme.primaryColor
                  }`,
                  backgroundColor:
                    sizeScale === scale
                      ? currentTheme.accentColor
                      : currentTheme.backgroundColor,
                  color:
                    sizeScale === scale
                      ? currentTheme.backgroundColor
                      : currentTheme.textColor,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: sizeScale === scale ? "bold" : "normal",
                }}
              >
                {scale === 1 ? "1.0x" : `${scale}x`}
              </button>
            ))}
          </div>
        </div>

        <div
          className="settings-label"
          style={{
            color: currentTheme.textColor,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "12px",
          }}
        >
          <span>폰트</span>
          <select
            value={fontFamily}
            onChange={(e) => {
              const selectedFont = e.target.value;
              setFontFamily(selectedFont);

              // 미리보기를 위해 임시로 저장
              const previewSettings = {
                workTime,
                breakTime,
                sessionsPerCycle,
                dailyGoal,
                workCharacterImage,
                breakCharacterImage,
                animationEnabled,
                soundEnabled,
                volume,
                sizeScale,
                fontFamily: selectedFont,
                alwaysOnTop,
              };
              localStorage.setItem(
                "pomodoroSettings",
                JSON.stringify(previewSettings)
              );
              localStorage.setItem("settingsChanged", Date.now().toString());
            }}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: `2px solid ${currentTheme.primaryColor}`,
              backgroundColor: currentTheme.backgroundColor,
              color: currentTheme.textColor,
              cursor: "pointer",
              fontSize: "12px",
              minWidth: "150px",
            }}
          >
            {predefinedFonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3
          className="settings-section-title"
          style={{ color: currentTheme.primaryColor }}
        >
          테마 선택
        </h3>

        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className="theme-button"
              style={{
                border:
                  themeId === theme.id
                    ? `3px solid ${currentTheme.accentColor}`
                    : `2px solid ${theme.primaryColor}`,
                backgroundColor: theme.backgroundColor,
                color: theme.textColor,
              }}
            >
              <div
                className="theme-preview"
                style={{
                  background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              ></div>
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3
          className="settings-section-title"
          style={{ color: currentTheme.primaryColor }}
        >
          초기화
        </h3>

        <div
          className="settings-label"
          style={{
            color: currentTheme.textColor,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>완료한 세션 수를 초기화합니다.</span>
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: `2px solid ${currentTheme.primaryColor}`,
              backgroundColor: currentTheme.backgroundColor,
              color: currentTheme.textColor,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            초기화
          </button>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={handleSave}
          className="settings-button settings-button-save"
          style={{ backgroundColor: currentTheme.accentColor }}
        >
          💾 저장
        </button>

        <button
          onClick={handleCancel}
          className="settings-button settings-button-cancel"
          style={{
            border: `2px solid ${currentTheme.primaryColor}`,
            backgroundColor: currentTheme.backgroundColor,
            color: currentTheme.textColor,
          }}
        >
          ✕ 취소
        </button>
      </div>

      <CustomAlert
        show={showAlert}
        message={alertMessage}
        theme={currentTheme}
        onClose={() => setShowAlert(false)}
      />

      {/* 초기화 확인 대화상자 */}
      {showResetConfirm &&
        createPortal(
          <div
            className="custom-alert-overlay"
            onClick={() => setShowResetConfirm(false)}
            role="presentation"
          >
            <div
              className="custom-alert-box"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                border: `3px solid ${currentTheme.primaryColor}`,
                color: currentTheme.textColor,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-dialog-title"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowResetConfirm(false);
                }
              }}
              tabIndex={-1}
            >
              <div className="custom-alert-message" id="reset-dialog-title">
                완료 횟수와 사이클을 초기화하시겠습니까?
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  className="custom-alert-button"
                  style={{
                    backgroundColor: currentTheme.accentColor,
                    color: currentTheme.backgroundColor,
                    flex: 1,
                  }}
                  onClick={handleResetConfirm}
                >
                  확인
                </button>
                <button
                  className="custom-alert-button"
                  style={{
                    backgroundColor: currentTheme.backgroundColor,
                    color: currentTheme.textColor,
                    border: `2px solid ${currentTheme.primaryColor}`,
                    flex: 1,
                  }}
                  onClick={() => setShowResetConfirm(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SettingsPage;
