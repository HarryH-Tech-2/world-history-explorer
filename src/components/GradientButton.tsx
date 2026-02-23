import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface GradientButtonProps {
  text: string;
  onPress: () => void;
  gradientColors?: [string, string];
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GradientButton({
  text,
  onPress,
  gradientColors = [colors.emerald500, colors.teal500],
  icon,
  disabled = false,
  style,
}: GradientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrapper,
        style,
        { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {icon && (
          <MaterialIcons name={icon} size={20} color={colors.white} style={styles.icon} />
        )}
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
