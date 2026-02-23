import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface TimerDisplayProps {
  timeRemaining: number;
  totalTime?: number;
}

export function TimerDisplay({ timeRemaining, totalTime = 30 }: TimerDisplayProps) {
  const fraction = timeRemaining / totalTime;
  const color = fraction > 0.5 ? colors.success : fraction > 0.25 ? colors.amber500 : colors.error;

  const scale = useSharedValue(1);

  useEffect(() => {
    if (fraction <= 0.25) {
      scale.value = withRepeat(withTiming(1.15, { duration: 400 }), -1, true);
    } else {
      scale.value = 1;
    }
  }, [fraction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaterialIcons name="timer" size={24} color={color} />
      <Text style={[styles.time, { color }]}>{timeRemaining}s</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 20,
    fontWeight: '700',
  },
});
