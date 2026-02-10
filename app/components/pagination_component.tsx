import { useCallback, useState } from 'react';
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    View,
    ViewStyle
} from "react-native";

export const getCurrentIndexFromScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
) => {
    const width = event.nativeEvent.layoutMeasurement.width;
    const x = event.nativeEvent.contentOffset.x;
    return Math.round(x / width);
};

export function usePagination() {
    const [index, setIndex] = useState(0);

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const current = getCurrentIndexFromScroll(event);
            setIndex(current);
        },
        []
    );

    return { index, onScroll, setIndex };
}

type PaginationProps = {
    length: number;
    currentIndex: number;
    paginationStyle?: ViewStyle;
    paginationDot?: ViewStyle;
    paginationDotSelected?: ViewStyle;
};

export function Pagination({ length, currentIndex, paginationStyle, paginationDot, paginationDotSelected }: PaginationProps) {
    return (
        <View style={[paginationStyle]}>
            {Array.from({ length }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        paginationDot,
                        currentIndex === index && paginationDotSelected,
                    ]}
                />
            ))}
        </View>
    );
}