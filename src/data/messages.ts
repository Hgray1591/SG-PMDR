import { MessageType } from "../types";

export const MESSAGES: Record<MessageType, string[]> = {
  workStart: [
    "자, 집중할 시간이에요! 화이팅!",
    "좋아요, 시작해볼까요?",
    "오늘도 열심히 해봐요!",
    "집중 모드 ON! 시작합니다~",
  ],
  workProgress: [
    "잘하고 있어요! 계속 가봐요!",
    "집중력 최고예요!",
    "벌써 여기까지 왔네요! 대단해요!",
    "조금만 더 힘내요!",
    "순조롭게 진행 중이에요~",
    "멋져요! 이 페이스 유지해요!",
    "화이팅! 잘하고 계세요!",
  ],
  workComplete: [
    "수고하셨어요! 잘 쉬어요~",
    "완료! 이제 휴식 시간이에요!",
    "훌륭해요! 푹 쉬세요!",
    "고생하셨어요! 잠깐 쉬어가요!",
  ],
  goalAchieved: [
    "오늘 목표 달성! 정말 대단해요! 🏆",
    "완벽해요! 오늘도 최고였어요! 🌟",
    "목표 완료! 자랑스러워요! ✨",
    "훌륭합니다! 오늘 할 일 끝! 🎉",
  ],
  imageClick: ["아야!", "왜 클릭?"],
};

export const getRandomMessage = (type: MessageType): string => {
  // 커스텀 메시지가 있으면 사용, 없으면 빈 문자열 반환
  const customMessages = localStorage.getItem("customMessages");

  if (customMessages) {
    try {
      const parsed = JSON.parse(customMessages);
      if (parsed[type] && parsed[type].length > 0) {
        const messages = parsed[type];
        return messages[Math.floor(Math.random() * messages.length)];
      }
    } catch {
      // 파싱 실패 시 빈 문자열 반환
    }
  }

  // 커스텀 메시지가 없으면 빈 문자열 반환
  return "";
};
