export interface PomodoroSettings {
  workTime: number; // 분 단위
  breakTime: number; // 분 단위
  sessionsPerCycle: number; // 반복 세션 수
  dailyGoal: number; // 하루 목표 세션 수
  workCharacterImageType?: string; // 일할 때 캐릭터 이미지 MIME 타입
  workCharacterImageKey?: string; // IndexedDB 키 (일반적으로 "work")
  breakCharacterImageType?: string; // 쉴 때 캐릭터 이미지 MIME 타입
  breakCharacterImageKey?: string; // IndexedDB 키 (일반적으로 "break")
  animationEnabled?: boolean; // 애니메이션 활성화 여부
  soundEnabled?: boolean; // 효과음 활성화 여부
  volume?: number; // 음량 (0~100)
  sizeScale?: number; // UI 배율 (1.0, 1.25, 1.5, 2.0)
  fontFamily?: string; // 폰트 패밀리
  alwaysOnTop?: boolean; // 항상 위 표시
}

export type SessionType = "work" | "break";

export interface PomodoroState {
  settings: PomodoroSettings;
  currentSessionType: SessionType;
  timeRemaining: number; // 초 단위
  isRunning: boolean;
  completedSessions: number;
  currentCycle: number;
}

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundImage?: string;
}

export type MessageType =
  | "workStart"
  | "workProgress"
  | "workComplete"
  | "goalAchieved"
  | "imageClick";

export interface CharacterMessage {
  type: MessageType;
  text: string;
}
