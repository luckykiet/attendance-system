import { GetMyCompaniesResult } from '@/types/workplaces';
import { useEffect } from 'react';
import { useNotificationScheduler } from './useNotificationScheduler';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DAYS_OF_WEEK, daysOfWeeksTranslations, TIME_FORMAT } from '@/constants/Days';
import useTranslation from './useTranslation';

dayjs.extend(customParseFormat);

const useScheduleWeekShifts = (data: Record<string, GetMyCompaniesResult>) => {
    const { scheduleNotificationIfNeeded } = useNotificationScheduler();
    const { t } = useTranslation();
    const schedulePrefix = 'upcoming-shift';
    useEffect(() => {
        for (const [, companyData] of Object.entries(data)) {
            const now = dayjs();
            const { workingAts, registers } = companyData;
            const todayIndex = now.day();

            for (const workingAt of workingAts) {
                const register = registers.find(r => r._id === workingAt.registerId);

                for (let i = 1; i <= 7; i++) {
                    const day = (todayIndex + i) % 7;
                    const dayKey = DAYS_OF_WEEK[day];
                    const translatedDay = t(daysOfWeeksTranslations[dayKey].shortcut);
                    const shiftDate = now.clone().add(i, 'day');

                    const shifts = workingAt.shifts[dayKey];
                    if (shifts) {
                        for (const shift of shifts) {
                            const shiftStartDateTime = shiftDate
                                .hour(Number(shift.start.split(':')[0]))
                                .minute(Number(shift.start.split(':')[1]))
                                .second(0);

                            const id = `${schedulePrefix}-${workingAt._id}-${shift._id}-${shiftDate.format('YYYY-MM-DD')}`;
                            const title = `${t('misc_upcoming_shift_at')} ${register?.name}`;
                            const body = `${t('misc_your_shift_start_at')} ${translatedDay} ${shiftStartDateTime.format(TIME_FORMAT)}.`;
                          
                            scheduleNotificationIfNeeded({
                                id,
                                title,
                                body,
                                scheduledTime: shiftStartDateTime,
                                warningBeforeMinutes: 60,
                            });
                        }
                    }
                }

            }
        }
    }, [data]);
}

export default useScheduleWeekShifts;