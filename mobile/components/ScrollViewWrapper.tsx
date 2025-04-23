import React, { useRef, useState } from 'react';
import {
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    View,
    LayoutChangeEvent,
    ScrollViewProps,
} from 'react-native';
import ScrollToBottomButton from './ScrollToBottomButton';

interface Props extends ScrollViewProps {
    children: React.ReactNode;
}

const ScrollToBottomWrapper: React.FC<Props> = ({ children, ...scrollViewProps }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [showScrollArrow, setShowScrollArrow] = useState(true);
    const [contentHeight, setContentHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

        // Scroll position logic
        const isScrolledToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        setShowScrollArrow(!isScrolledToBottom && contentSize.height > layoutMeasurement.height);
        scrollViewProps?.onScroll?.(event); // call parent onScroll if provided
    };

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    const onContentSizeChange = (w: number, h: number) => {
        setContentHeight(h);
    };

    const onLayout = (e: LayoutChangeEvent) => {
        setContainerHeight(e.nativeEvent.layout.height);
    };

    return (
        <View style={{ flex: 1 }} onLayout={onLayout}>
            <ScrollView
                ref={scrollViewRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={onContentSizeChange}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                {...scrollViewProps}
            >
                {children}
            </ScrollView>

            {showScrollArrow && contentHeight > containerHeight && <ScrollToBottomButton onPress={scrollToBottom} />}
        </View>
    );
};

export default ScrollToBottomWrapper;
