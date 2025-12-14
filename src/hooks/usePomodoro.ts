import { useState, useEffect, useCallback, useRef } from "react";
import { PomodoroState, PomodoroSettings, SessionType } from "../types";

// 디버깅 모드: true면 초 단위, false면 분 단위
export const DEBUG_MODE = false;

// 시간 변환 헬퍼 함수
const toSeconds = (minutes: number) => (DEBUG_MODE ? minutes : minutes * 60);

const DEFAULT_SETTINGS: PomodoroSettings = {
  workTime: 25,
  breakTime: 5,
  sessionsPerCycle: 4,
  dailyGoal: 8,
  animationEnabled: true,
  soundEnabled: true,
  volume: 30,
  fontFamily: "GMarketSans",
};

export const usePomodoro = () => {
  const [state, setState] = useState<PomodoroState>(() => {
    // localStorage에서 저장된 상태 불러오기
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return {
          ...parsed,
          isRunning: false, // 새로고침 시 자동 시작 방지
        };
      } catch {
        // Failed to load state, use default
      }
    }

    // 기본 상태
    const settings = (() => {
      const saved = localStorage.getItem("pomodoroSettings");
      if (saved) {
        try {
          return JSON.parse(saved) as PomodoroSettings;
        } catch {
          // Failed to load settings, use default
        }
      }
      return DEFAULT_SETTINGS;
    })();

    return {
      settings,
      currentSessionType: "work" as SessionType,
      timeRemaining: toSeconds(settings.workTime),
      isRunning: false,
      completedSessions: 0,
      currentCycle: 0,
    };
  });

  const intervalRef = useRef<number | null>(null);

  // 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify(state));
  }, [state]);

  const saveSettings = useCallback((settings: PomodoroSettings) => {
    localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
  }, []);

  useEffect(() => {
    if (state.isRunning && state.timeRemaining > 0) {
      intervalRef.current = globalThis.setInterval(() => {
        setState((prev) => {
          if (prev.timeRemaining <= 1) {
            // 타이머 종료
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
            };
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else if (state.timeRemaining === 0 && !state.isRunning) {
      handleSessionComplete();
    }
  }, [state.isRunning]);

  const handleSessionComplete = useCallback(() => {
    const isWorkSession = state.currentSessionType === "work";
    const newCompletedSessions = isWorkSession
      ? state.completedSessions + 1
      : state.completedSessions;

    // 사이클 완료 여부 체크 (세션 반복 수만큼 완료했는지)
    const isCycleComplete =
      isWorkSession &&
      newCompletedSessions % state.settings.sessionsPerCycle === 0;

    setState((prev) => {
      const newCycle = isCycleComplete
        ? prev.currentCycle + 1
        : prev.currentCycle;

      // 사이클이 완료되면 work로, 아니면 기존 로직대로
      let nextSessionType: SessionType;
      if (isCycleComplete) {
        // 사이클 완료 시 work로 초기화
        nextSessionType = "work";
      } else {
        // 사이클 진행 중: work → break, break → work
        nextSessionType = prev.currentSessionType === "work" ? "break" : "work";
      }

      const nextTime =
        nextSessionType === "work"
          ? toSeconds(prev.settings.workTime)
          : toSeconds(prev.settings.breakTime);

      // 사이클이 완료되지 않았으면 자동 계속 진행
      const shouldContinue = !isCycleComplete;

      return {
        ...prev,
        currentSessionType: nextSessionType,
        timeRemaining: nextTime,
        isRunning: shouldContinue,
        completedSessions: newCompletedSessions,
        currentCycle: newCycle,
      };
    });

    // 세션 완료 이벤트 발생
    if (state.currentSessionType === "work") {
      globalThis.dispatchEvent(
        new CustomEvent("sessionComplete", {
          detail: {
            completedSessions: newCompletedSessions,
            dailyGoal: state.settings.dailyGoal,
          },
        })
      );
    }

    // 사이클 완료 이벤트 발생
    if (isCycleComplete) {
      globalThis.dispatchEvent(
        new CustomEvent("cycleComplete", {
          detail: {
            currentCycle: state.currentCycle + 1,
          },
        })
      );
    }
  }, [
    state.currentSessionType,
    state.completedSessions,
    state.settings.dailyGoal,
    state.settings.sessionsPerCycle,
    state.currentCycle,
  ]);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      timeRemaining:
        prev.currentSessionType === "work"
          ? prev.settings.workTime * 60
          : prev.settings.breakTime * 60, // 원본: 분 단위
      // timeRemaining:
      //   prev.currentSessionType === "work"
      //     ? prev.settings.workTime
      //     : prev.settings.breakTime, // 디버깅: 초 단위
      isRunning: false,
    }));
  }, []);

  const skipSession = useCallback(() => {
    setState((prev) => {
      const nextSessionType: SessionType =
        prev.currentSessionType === "work" ? "break" : "work";
      const nextTime =
        nextSessionType === "work"
          ? toSeconds(prev.settings.workTime)
          : toSeconds(prev.settings.breakTime); // 원본: 분 단위
      // const nextTime =
      //   nextSessionType === "work"
      //     ? prev.settings.workTime
      //     : prev.settings.breakTime; // 디버깅: 초 단위

      return {
        ...prev,
        currentSessionType: nextSessionType,
        timeRemaining: nextTime,
        isRunning: false,
      };
    });
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<PomodoroSettings>) => {
      setState((prev) => {
        const updated = { ...prev.settings, ...newSettings };
        saveSettings(updated);

        // 현재 세션 타입의 시간이 변경되었는지 확인
        const isWorkTimeChanged =
          newSettings.workTime !== undefined &&
          newSettings.workTime !== prev.settings.workTime &&
          prev.currentSessionType === "work";

        const isBreakTimeChanged =
          newSettings.breakTime !== undefined &&
          newSettings.breakTime !== prev.settings.breakTime &&
          prev.currentSessionType === "break";

        // 현재 세션 타입의 시간이 변경되면 리셋
        if (isWorkTimeChanged || isBreakTimeChanged) {
          const newTime =
            prev.currentSessionType === "work"
              ? toSeconds(updated.workTime)
              : toSeconds(updated.breakTime);

          return {
            ...prev,
            settings: updated,
            timeRemaining: newTime,
            isRunning: false, // 리셋 시 타이머 정지
          };
        }

        // 설정만 업데이트하고 현재 진행 상태는 유지
        return {
          ...prev,
          settings: updated,
        };
      });
    },
    [saveSettings]
  );

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  return {
    state,
    start,
    pause,
    reset,
    skipSession,
    updateSettings,
    formatTime,
  };
};
