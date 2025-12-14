/**
 * IndexedDB를 사용한 이미지 저장소
 * localStorage의 용량 제한(5~10MB)을 우회하기 위해 사용
 */

const DB_NAME = "otk-pomo-images";
const DB_VERSION = 1;
const STORE_NAME = "images";

interface ImageData {
  id: string;
  dataUrl: string;
  fileType: string;
  timestamp: number;
}

/**
 * IndexedDB 초기화 및 연결
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

/**
 * 이미지를 IndexedDB에 저장
 * @param id - 이미지 식별자 (예: "work" 또는 "break")
 * @param dataUrl - base64 인코딩된 이미지 데이터
 * @param fileType - MIME 타입
 */
export const saveImageToIndexedDB = async (
  id: string,
  dataUrl: string,
  fileType: string
): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  const imageData: ImageData = {
    id,
    dataUrl,
    fileType,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(imageData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * IndexedDB에서 이미지 로드
 * @param id - 이미지 식별자
 */
export const loadImageFromIndexedDB = async (
  id: string
): Promise<ImageData | null> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * IndexedDB에서 이미지 삭제
 * @param id - 이미지 식별자
 */
export const deleteImageFromIndexedDB = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * 모든 이미지 키 목록 가져오기
 */
export const getAllImageKeys = async (): Promise<string[]> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
};
