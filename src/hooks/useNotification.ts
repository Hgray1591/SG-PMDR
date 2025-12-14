import { useEffect, useCallback } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export const useNotification = () => {
  const checkPermission = useCallback(async () => {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      return permissionGranted;
    } catch {
      // Failed to check notification permission
      return false;
    }
  }, []);

  useEffect(() => {
    checkPermission().catch(() => {
      // Notification permission check failed
    });
  }, [checkPermission]);

  const notify = useCallback(async (title: string, body: string) => {
    try {
      const permissionGranted = await checkPermission();
      if (permissionGranted) {
        await sendNotification({ title, body });
      }
    } catch {
      // Failed to send notification
    }
  }, [checkPermission]);

  return { notify };
};
