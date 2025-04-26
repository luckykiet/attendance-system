import { GetMyCompaniesResult } from '@/types/workplaces';
import { useEffect } from 'react';
import { useNotificationScheduler } from './useNotificationScheduler';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DAYS_OF_WEEK, daysOfWeeksTranslations, TIME_FORMAT } from '@/constants/Days';
import useTranslation from './useTranslation';

dayjs.extend(customParseFormat);

const useScheduleWeekShifts = (data: Record<string, GetMyCompaniesResult>) => {
    const {
        scheduleNotificationIfNeeded,
        getScheduledNotificationsByPrefix,
        cancelScheduledNotification,
        loaded
    } = useNotificationScheduler();
    const { t } = useTranslation();
    const schedulePrefix = 'upcoming-shift';

    useEffect(() => {
        if (!loaded) return;

        for (const [, companyData] of Object.entries(data)) {
            const now = dayjs();
            const { workingAts, registers } = companyData;
            const todayIndex = now.day();

            for (const workingAt of workingAts) {
                const register = registers.find(r => r._id === workingAt.registerId);

                for (let i = 0; i <= 7; i++) {
                    const day = (todayIndex + i) % 7;
                    const dayKey = DAYS_OF_WEEK[day];
                    const translatedDay = t(daysOfWeeksTranslations[dayKey].shortcut);
                    const shiftDate = now.clone().add(i, 'day');

                    const shifts = workingAt.shifts[dayKey];
                    if (shifts) {
                        const shiftNotifications = new Map<string, {
                            id: string;
                            idPrefix: string;
                            title: string;
                            body: string;
                            scheduledTime: dayjs.Dayjs;
                            warningBeforeMinutes: number;
                        }>();

                        for (const shift of shifts) {
                            const shiftStartDateTime = shiftDate
                                .hour(Number(shift.start.split(':')[0]))
                                .minute(Number(shift.start.split(':')[1]))
                                .second(0);

                            const isToday = i === 0;
                            if (isToday && shiftStartDateTime.isBefore(now)) {
                                continue;
                            }

                            const idPrefix = `${schedulePrefix}-${workingAt._id}-${shift._id}-${shiftStartDateTime.format('YYYY-MM-DD')}`;
                            const id = `${idPrefix}-${shiftStartDateTime.format('HH-mm')}`;

                            const title = `${t('misc_upcoming_shift_at')} ${register?.name}`;
                            const body = `${t('misc_your_shift_start_at')} ${translatedDay} ${shiftStartDateTime.format(TIME_FORMAT)}.`;

                            shiftNotifications.set(id, {
                                id,
                                idPrefix,
                                title,
                                body,
                                scheduledTime: shiftStartDateTime,
                                warningBeforeMinutes: 60,
                            });
                        }

                        const processNotifications = async () => {
                            for (const id of shiftNotifications.keys()) {
                                const notification = shiftNotifications.get(id);
                                if (notification) {
                                    const { idPrefix } = notification;
                                    const scheduledNotifications = await getScheduledNotificationsByPrefix(idPrefix);
                                    const isAlreadyScheduled = scheduledNotifications.some((n) => n === id);
                                    const oldIds = scheduledNotifications.filter(notificationId => notificationId !== id && !shiftNotifications.has(notificationId));

                                    await Promise.all(oldIds.map(id => cancelScheduledNotification(id)));

                                    if (!isAlreadyScheduled) {
                                        await scheduleNotificationIfNeeded(notification);
                                        console.log('Scheduled new notification:', id);
                                    }
                                }
                            }
                        };

                        processNotifications();
                    }
                }
            }
        }
    }, [data, loaded]);
};

export default useScheduleWeekShifts;
