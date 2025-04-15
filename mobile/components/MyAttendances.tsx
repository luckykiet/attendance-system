import React, { useState, useRef, Fragment } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
    NativeScrollEvent,
    NativeSyntheticEvent
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppStore } from '@/stores/useAppStore';
import { useAttendancesApi } from '@/api/useAttendancesApi';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import { useColorScheme } from '@/hooks/useColorScheme';
import useTranslation from '@/hooks/useTranslation';

import { Attendance, DailyAttendance } from '@/types/attendance';
import { MyWorkplace } from '@/types/workplaces';
import { MyWorkingAt } from '@/types/working-at';
import { calculateHoursFromMinutes, getStartEndTime } from '@/utils';
import { TIME_FORMAT } from '@/constants/Days';
import { PatternFormat } from 'react-number-format';
import { Colors } from '@/constants/Colors';
import _ from 'lodash';

interface MyAttendancesProps {
    retailId: string;
    domain: string;
}

type AttendanceWithRegister = Attendance & {
    register?: MyWorkplace;
    workingAt?: MyWorkingAt;
    dailyAttendance?: DailyAttendance;
};

const limit = 10;

const MyAttendances: React.FC<MyAttendancesProps> = ({ retailId, domain }) => {
    const { t } = useTranslation();
    const { t: noCap } = useTranslation({ capitalize: false });
    const { appId } = useAppStore();
    const colorScheme = useColorScheme();
    const scrollViewRef = useRef<FlatList<Attendance>>(null);
    const { getAttendancesByRetail } = useAttendancesApi();

    const [showScrollArrow, setShowScrollArrow] = useState(false);

    const {
        data,
        fetchNextPage,
        isFetching,
        isLoading,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['attendances', domain, retailId],
        queryFn: ({ pageParam = 0 }) =>
            getAttendancesByRetail({ domain, retailId, limit, skip: pageParam * limit }),
        getNextPageParam: (lastPage, _, lastPageParam) =>
            lastPage.hasMore ? lastPageParam + 1 : undefined,
        initialPageParam: 0,
        enabled: !!appId && !!domain && !!retailId,
    });

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
        const isScrolledToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        setShowScrollArrow(!isScrolledToBottom);
    };

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    const loadMore = () => {
        if (!isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const attendances = data?.pages.flatMap((page) =>
        page.attendances.map((attendance) => {
            const workingAt = page.workingAts.find(w => w._id === attendance.workingAtId);
            if (!workingAt) return attendance;
            const register = page.registers.find(r => r._id === workingAt.registerId);
            if (!register) return { ...attendance, workingAt };
            const dailyAttendance = page.dailyAttendances.find(d => d._id === attendance.dailyAttendanceId);
            return { ...attendance, workingAt, register, dailyAttendance };
        })
    ) ?? [];

    const retail = data?.pages[0]?.retail;

    if (!retail) return null;

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.header}>
                <ThemedText type="subtitle" style={styles.headerText}>{retail.name}</ThemedText>
                <ThemedText style={styles.headerSub}>{t('misc_tin')}: {retail.tin}</ThemedText>
                <ThemedText style={styles.headerSub}>{retail.address.street}</ThemedText>
                <ThemedText style={styles.headerSub}>
                    <PatternFormat
                        value={retail.address.zip}
                        displayType="text"
                        format="### ##"
                        renderText={(formattedValue) => (
                            <ThemedText style={styles.headerSub}>{formattedValue}</ThemedText>
                        )}
                    /> {retail.address.city}
                </ThemedText>
            </ThemedView>

            <ThemedView style={styles.titleContainer}>
                <ThemedText type="subtitle" style={styles.nearbyLabel}>
                    {t('misc_attendances')}:
                </ThemedText>
                <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
                    <MaterialIcons
                        name="refresh"
                        size={24}
                        color={colorScheme === 'light' ? 'black' : 'white'}
                    />
                </TouchableOpacity>
            </ThemedView>

            {(isLoading || isFetching) && <ThemedActivityIndicator size="large" />}

            {attendances.length > 0 ? (
                <FlatList<AttendanceWithRegister>
                    ref={scrollViewRef}
                    data={attendances}
                    renderItem={({ item }) => {
                        const date = item.dailyAttendance?.date ? dayjs(item.dailyAttendance?.date.toString(), 'YYYYMMDD') : null;

                        const workingHour = item.dailyAttendance?.workingHour ? getStartEndTime({ start: item.dailyAttendance.workingHour.start, end: item.dailyAttendance.workingHour.end }) : null;

                        return <View style={styles.attendanceItem}>
                            <ThemedText style={styles.attendanceText}>
                                {`${t('misc_date')}: ${date ? date.format('DD/MM/YYYY') : '-'}`}
                            </ThemedText>
                            <ThemedText style={styles.attendanceText}>
                                {workingHour ? `${t('misc_working_hour')}: ${workingHour.startTime.format(TIME_FORMAT) ?? '-'} - ${workingHour.endTime.format(TIME_FORMAT)}${workingHour.isOverNight ? ` (${t('misc_overnight')})` : ''}` : '-'}
                            </ThemedText>
                            <ThemedText style={styles.attendanceText}>
                                {`${t('misc_check_in')}: ${item.checkInTime ? dayjs(item.checkInTime).format('DD/MM/YYYY HH:mm:ss') : '-'}`}
                            </ThemedText>
                            <ThemedText style={styles.attendanceText}>
                                {`${t('misc_check_out')}: ${item.checkOutTime ? dayjs(item.checkOutTime).format('DD/MM/YYYY HH:mm:ss') : '-'}`}
                            </ThemedText>
                            {item.register && (
                                <>
                                    <ThemedText style={styles.registerText}>
                                        {`${t('misc_workplace')}: ${item.register.name}`}
                                    </ThemedText>
                                    <ThemedText style={styles.registerText}>
                                        {`${item.register.address.street}`}
                                    </ThemedText>
                                    <ThemedText style={styles.registerText}>
                                        <PatternFormat
                                            value={item.register.address.zip}
                                            displayType="text"
                                            format="### ##"
                                            renderText={(formattedValue) => (
                                                <ThemedText style={styles.registerText}>{formattedValue}</ThemedText>
                                            )}
                                        /> {item.register.address.city}
                                    </ThemedText>
                                </>
                            )}
                            {item.breaks && item.breaks.length > 0 && (
                                <>
                                    <View style={styles.breakDivider} />
                                    <ThemedText style={styles.attendanceBreakTitle}>
                                        {`${t('misc_breaks')}:`}
                                    </ThemedText>

                                    {item.breaks.map((breakItem) => {
                                        const realDuration = breakItem.checkInTime && breakItem.checkOutTime
                                            ? dayjs(breakItem.checkOutTime).diff(dayjs(breakItem.checkInTime), 'minute')
                                            : 0;

                                        const realDurationCalculated = realDuration > 0 ? calculateHoursFromMinutes(realDuration) : { hours: 0, minutes: 0 };

                                        const isExceededTime = realDuration && breakItem.breakHours.duration && realDuration > breakItem.breakHours.duration;

                                        return <Fragment key={breakItem._id}>
                                            <ThemedText key={breakItem._id} style={styles.attendanceBreakNameText}>
                                                {`${t('misc_break')}: ${breakItem.name}`}
                                            </ThemedText>
                                            <ThemedText style={styles.attendanceText}>
                                                {`${t('misc_check_in')}: ${breakItem.checkInTime ? dayjs(breakItem.checkInTime).format('DD/MM/YYYY HH:mm:ss') : '-'}`}
                                            </ThemedText>
                                            <ThemedText style={styles.attendanceText}>
                                                {`${t('misc_check_out')}: ${breakItem.checkOutTime ? dayjs(breakItem.checkOutTime).format('DD/MM/YYYY HH:mm:ss') : '-'}`}
                                            </ThemedText>
                                            {_.isNumber(realDuration) && realDuration > 0 && (() => {
                                                const { hours, minutes } = realDurationCalculated;

                                                const durationStr =
                                                    hours || minutes
                                                        ? [
                                                            hours > 0 ? `${hours} ${noCap('misc_hour_short')}` : '',
                                                            minutes > 0 ? `${minutes} ${noCap('misc_min_short')}` : ''
                                                        ].filter(Boolean).join(' ')
                                                        : `0 ${noCap('misc_min_short')}`;

                                                const exceededText = isExceededTime ? ` (${t('misc_exceeded_time')})` : '';

                                                return (
                                                    <ThemedText style={[styles.attendanceText, isExceededTime ? { color: Colors.error } : null]}>
                                                        {`${t('misc_duration')}: ${durationStr}${exceededText}`}
                                                    </ThemedText>
                                                );
                                            })()}
                                        </Fragment>
                                    })}
                                </>
                            )}
                        </View>
                    }}
                    keyExtractor={(item) => item._id}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                />
            ) : (
                <ThemedView style={styles.noDataContainer}>
                    <ThemedText>{t('misc_no_attendance')}</ThemedText>
                </ThemedView>
            )}

            {isFetchingNextPage && <ThemedActivityIndicator size="small" />}

            {showScrollArrow && (
                <TouchableOpacity
                    style={[
                        styles.arrowContainer,
                        { backgroundColor: colorScheme === 'dark' ? '#979998' : '#e3e6e4' }
                    ]}
                    onPress={scrollToBottom}
                >
                    <MaterialIcons
                        name="keyboard-arrow-down"
                        size={24}
                        color={colorScheme === 'light' ? 'black' : 'white'}
                    />
                </TouchableOpacity>
            )}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10
    },
    header: {
        marginTop: 10,
        marginBottom: 4
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    headerSub: {
        fontSize: 12,
        color: 'gray'
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    nearbyLabel: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    refreshButton: {
        padding: 8
    },
    attendanceItem: {
        padding: 10,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8
    },
    attendanceText: {
        fontSize: 14
    },
    registerText: {
        fontSize: 14,
        color: 'gray'
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        borderRadius: 15,
        padding: 5
    },
    breakDivider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 8,
    },
    attendanceBreakTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4
    },
    attendanceBreakNameText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default MyAttendances;
