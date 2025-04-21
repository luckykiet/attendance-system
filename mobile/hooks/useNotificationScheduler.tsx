import { useRef } from 'react';
import * as Notifications from 'expo-notifications';
import dayjs, { Dayjs } from 'dayjs';

type NotificationSchedulerOptions = {
  id: string;
  title: string;
  body: string;
  scheduledTime: Dayjs;
  now?: Dayjs;
  warningBeforeMinutes?: number;
  channelId?: string;
};

export function useNotificationScheduler() {
  const notifiedIds = useRef<Set<string>>(new Set());

  const scheduleNotificationIfNeeded = async ({
    id,
    title,
    body,
    scheduledTime,
    now = dayjs(),
    warningBeforeMinutes = 10,
    channelId = 'default',
  }: NotificationSchedulerOptions) => {
    if (notifiedIds.current.has(id)) return; // already scheduled

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
        trigger: { seconds: secondsUntilNotification, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, channelId},
      });
    }

    notifiedIds.current.add(id);
  };

  const cancelScheduledNotification = async (id: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      notifiedIds.current.delete(id);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  };

  const cancelAllScheduledNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      notifiedIds.current.clear();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  };

  return { scheduleNotificationIfNeeded, cancelScheduledNotification, cancelAllScheduledNotifications };
}
