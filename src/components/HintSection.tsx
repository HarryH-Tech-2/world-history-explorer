import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface HintSectionProps {
  hints: string[];
  totalHints: number;
  onRevealHint: () => void;
}

export function HintSection({ hints, totalHints, onRevealHint }: HintSectionProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Hints ({hints.length}/{totalHints})</Text>
        {hints.length < totalHints && (
          <Pressable onPress={onRevealHint} style={styles.revealButton}>
            <MaterialIcons name="lightbulb" size={16} color={colors.amber500} />
            <Text style={styles.revealText}>Reveal (-25 pts)</Text>
          </Pressable>
        )}
      </View>

      {hints.map((hint, index) => (
        <View key={index} style={styles.hintCard}>
          <Text style={styles.hintNumber}>{index + 1}.</Text>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.orange500,
    fontSize: 14,
    fontWeight: '600',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  revealText: {
    color: colors.amber500,
    fontSize: 12,
    fontWeight: '500',
  },
  hintCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(249,115,22,0.06)',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    gap: 8,
  },
  hintNumber: {
    color: colors.orange500,
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});
