import React, { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppStore } from '@/stores/useAppStore';
import { useAttendancesApi } from '@/api/useAttendancesApi';
import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import { useColorScheme } from '@/hooks/useColorScheme';
import _ from 'lodash';
import useTranslation from '@/hooks/useTranslation';

interface Register {
    _id: string;
    name: string;
    address: {
        street: string;
        city: string;
        zip: string;
    };
}

interface Attendance {
    _id: string;
    date: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    registerId: string;
    register?: Register;
}

interface MyAttendancesProps {
    url: string;
}
const limit = 10;

const MyAttendances: React.FC<MyAttendancesProps> = ({ url }) => {
    const { t } = useTranslation();
    const { appId } = useAppStore();
    const colorScheme = useColorScheme();
    const scrollViewRef = useRef<FlatList<Attendance>>(null);

    const [showScrollArrow, setShowScrollArrow] = useState<boolean>(false);
    const { getAttendances } = useAttendancesApi();

    const {
        data,
        fetchNextPage,
        isFetching,
        isLoading,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['attendances', url],
        queryFn: ({ pageParam = 0 }) => getAttendances({ domain: url, limit, skip: pageParam * limit }),
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
            if (!lastPage.hasMore) {
                return undefined
            }
            return lastPageParam + 1
        },
        enabled: !!appId && !_.isEmpty(url),
        initialPageParam: 0,
    });

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
        const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
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

    const attendances = data?.pages.flatMap(page => {
        const { registers, attendances } = page;
        return attendances.map((attendance: Attendance) => {
            const register = registers.find((r: Register) => r._id === attendance.registerId);
            return { ...attendance, register };
        });
    }) || [];

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <ThemedText style={styles.headerText}>My Attendances ({url})</ThemedText>
            </View>
            {(isLoading || isFetching) && <ThemedActivityIndicator size="large" />}
            {attendances.length > 0 ? (
                <FlatList
                    ref={scrollViewRef}
                    data={attendances}
                    renderItem={({ item }) => (
                        <View style={styles.attendanceItem}>
                            <ThemedText style={styles.attendanceText}>{`${t('misc_date')}: ${dayjs(item.date).format('DD-MM-YYYY')}`}</ThemedText>
                            <ThemedText style={styles.attendanceText}>{`${t('misc_check_in')}: ${dayjs(item.checkInTime).format('HH:mm:ss') || '-'}`}</ThemedText>
                            <ThemedText style={styles.attendanceText}>{`${t('misc_check_out')}: ${dayjs(item.checkOutTime).format('HH:mm:ss') || '-'}`}</ThemedText>
                            {item.register && (
                                <>
                                    <ThemedText style={styles.registerText}>{`${t('misc_workplace')}: ${item.register.name}`}</ThemedText>
                                    <ThemedText style={styles.registerText}>{`${t('misc_address')}: ${item.register.address.street}, ${item.register.address.city} ${item.register.address.zip}`}</ThemedText>
                                </>
                            )}
                        </View>
                    )}
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
                    style={[styles.arrowContainer, { backgroundColor: colorScheme === 'dark' ? '#979998' : '#e3e6e4' }]}
                    onPress={scrollToBottom}
                >
                    <MaterialIcons name="keyboard-arrow-down" size={24} color={colorScheme === 'light' ? "black" : "white"} />
                </TouchableOpacity>
            )}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    attendanceItem: {
        padding: 10,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    attendanceText: {
        fontSize: 14,
    },
    registerText: {
        fontSize: 14,
        color: 'gray',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        borderRadius: 15,
        padding: 5,
    },
});

export default MyAttendances;
