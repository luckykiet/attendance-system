import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs, { Dayjs } from 'dayjs';

const STORAGE_KEY = 'scheduledNotificationIds';

type NotificationSchedulerOptions = {
  id: string;
  title: string;
  body: string;
  scheduledTime: Dayjs;
  now?: Dayjs;
  warningBeforeMinutes?: number;
  channelId?: string;
};

export const useNotificationScheduler = () => {
  const notifiedIds = useRef<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadScheduledIds = async () => {
      try {
        await cleanPassedScheduledNotifications();
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const ids: string[] = JSON.parse(json);
          notifiedIds.current = new Set(ids);
        }
      } catch (error) {
        console.error('Failed to load scheduled notification IDs:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadScheduledIds();
  }, []);

  const saveScheduledId = async (id: string) => {
    if (notifiedIds.current.has(id)) {
      return;
    }
    notifiedIds.current.add(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...notifiedIds.current]));
    } catch (error) {
      console.error('Failed to save scheduled notification ID:', error);
    }
  };

  const scheduleNotificationIfNeeded = async ({
    id,
    title,
    body,
    scheduledTime,
    now = dayjs(),
    warningBeforeMinutes = 10,
    channelId = 'default',
  }: NotificationSchedulerOptions) => {
    if (!loaded) return; // wait for storage to load
    if (notifiedIds.current.has(id)) return;

    const fireTime = scheduledTime.subtract(warningBeforeMinutes, 'minute');
    const secondsUntilNotification = fireTime.diff(now, 'second');

    if (secondsUntilNotification <= 0) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: null,
      });
    } else {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: {
          seconds: secondsUntilNotification,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          channelId,
        },
      });
    }

    await saveScheduledId(id);
  };

  const cancelScheduledNotification = async (id: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      notifiedIds.current.delete(id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...notifiedIds.current]));
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  const cancelAllScheduledNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      notifiedIds.current.clear();
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  };

  const cancelNotificationsByPrefix = async (prefix: string) => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;
      const allIds: string[] = JSON.parse(json);
      const matchingIds = allIds.filter(id => id.startsWith(prefix));

      for (const id of matchingIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
          notifiedIds.current.delete(id);
        } catch (err) {
          console.warn(`Failed to cancel notification with id ${id}`, err);
        }
      }

      const remainingIds = [...notifiedIds.current];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remainingIds));
    } catch (error) {
      console.error(`Failed to cancel notifications with prefix "${prefix}":`, error);
    }
  };

  const getScheduledNotificationsByPrefix = async (prefix: string): Promise<string[]> => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return [];
      const allIds: string[] = JSON.parse(json);
      const matchingIds = allIds.filter(storedId => storedId.startsWith(prefix));

      return matchingIds;
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  const cleanPassedScheduledNotifications = async () => {
    if (!loaded) return;
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;

      const allIds: string[] = JSON.parse(json);

      const pendingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const pendingIds = pendingNotifications.map(n => n.identifier);

      const validIds = allIds.filter(id => pendingIds.includes(id));

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validIds));
      console.log('Cleaned passed notifications. Remaining IDs:', validIds.length);
    } catch (error) {
      console.error('Failed to clean passed scheduled notifications:', error);
    }
  };

  return {
    scheduleNotificationIfNeeded,
    cancelScheduledNotification,
    cancelAllScheduledNotifications,
    cancelNotificationsByPrefix,
    getScheduledNotificationsByPrefix,
    loaded,
  };
};
