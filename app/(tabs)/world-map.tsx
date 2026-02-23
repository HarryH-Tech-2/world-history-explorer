import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/GlassCard';
import { allHistoricalEvents } from '../../src/data/events';
import { ERA_INFO, Era, HistoricalEvent } from '../../src/data/models';
import { colors } from '../../src/theme/colors';
import { generateWorldMapImage } from '../../src/services/gemini';

const { width } = Dimensions.get('window');
const MAP_WIDTH = width - 40;
const MAP_HEIGHT = MAP_WIDTH * 0.58;

const ERA_RANGES: Record<Era, [number, number]> = {
  ancient: [-3000, -500],
  classical: [-500, 500],
  medieval: [500, 1500],
  renaissance: [1400, 1700],
  enlightenment: [1700, 1850],
  modern: [1850, 1950],
  contemporary: [1950, 2025],
};

const ERA_COLORS: Record<Era, string> = {
  ancient: '#9A3412',
  classical: '#B91C1C',
  medieval: '#7C3AED',
  renaissance: '#2563EB',
  enlightenment: '#0891B2',
  modern: '#059669',
  contemporary: '#F97316',
};

export default function WorldMapScreen() {
  const [selectedEra, setSelectedEra] = useState<Era>('modern');
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    generateWorldMapImage().then(img => {
      setMapImage(img);
      setMapLoading(false);
    }).catch(() => setMapLoading(false));
  }, []);

  const eraRange = ERA_RANGES[selectedEra];
  const filteredEvents = useMemo(
    () => allHistoricalEvents.filter(e => e.year >= eraRange[0] && e.year <= eraRange[1]),
    [selectedEra]
  );

  const eraKeys = Object.keys(ERA_INFO) as Era[];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>World Map</Text>
          <Text style={styles.headerSubtitle}>Explore events across time and place</Text>
        </Animated.View>

        {/* Era Selector */}
        <Animated.View entering={FadeIn.duration(600).delay(100)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eraScroller}>
            {eraKeys.map(era => {
              const info = ERA_INFO[era];
              const isSelected = selectedEra === era;
              return (
                <Pressable
                  key={era}
                  onPress={() => { setSelectedEra(era); setSelectedEvent(null); }}
                  style={[
                    styles.eraChip,
                    isSelected && { backgroundColor: ERA_COLORS[era], borderColor: ERA_COLORS[era] },
                  ]}
                >
                  <Text style={styles.eraChipEmoji}>{info.emoji}</Text>
                  <Text style={[
                    styles.eraChipText,
                    isSelected && { color: colors.white },
                  ]}>{info.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Map Image */}
        <Animated.View entering={FadeIn.duration(600).delay(200)}>
          <GlassCard style={styles.mapCard}>
            <View style={styles.mapContainer}>
              {mapLoading ? (
                <View style={styles.mapPlaceholder}>
                  <ActivityIndicator size="large" color={colors.orange500} />
                  <Text style={styles.mapLoadingText}>Loading map...</Text>
                </View>
              ) : mapImage ? (
                <Image
                  source={{ uri: `data:image/png;base64,${mapImage}` }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <MaterialIcons name="public" size={48} color={colors.orange300} />
                  <Text style={styles.mapLoadingText}>Map unavailable</Text>
                </View>
              )}
            </View>

            <View style={styles.mapLegend}>
              <Text style={styles.legendText}>
                {ERA_INFO[selectedEra].emoji} {ERA_INFO[selectedEra].name} ({ERA_INFO[selectedEra].span})
              </Text>
              <Text style={styles.legendCount}>{filteredEvents.length} events</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Selected Event Detail */}
        {selectedEvent && (
          <Animated.View entering={SlideInUp.duration(400)}>
            <GlassCard style={styles.detailCard}>
              <Text style={styles.detailName}>{selectedEvent.name}</Text>
              <View style={styles.detailMeta}>
                <MaterialIcons name="calendar-today" size={14} color={colors.orange500} />
                <Text style={styles.detailMetaText}>
                  {selectedEvent.year < 0 ? `${Math.abs(selectedEvent.year)} BCE` : `${selectedEvent.year} CE`}
                </Text>
                <MaterialIcons name="location-on" size={14} color={colors.orange500} style={{ marginLeft: 12 }} />
                <Text style={styles.detailMetaText}>{selectedEvent.location}</Text>
              </View>
              <Text style={styles.detailDescription}>{selectedEvent.description}</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Event List for this Era */}
        <Animated.View entering={FadeIn.duration(600).delay(400)}>
          <Text style={styles.sectionTitle}>Events in this Era</Text>
          {filteredEvents
            .sort((a, b) => a.year - b.year)
            .map(event => (
              <Pressable
                key={event.id}
                onPress={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                style={[
                  styles.eventListItem,
                  selectedEvent?.id === event.id && styles.eventListItemSelected,
                ]}
              >
                <View style={[styles.eventListDot, { backgroundColor: ERA_COLORS[selectedEra] }]} />
                <View style={styles.eventListInfo}>
                  <Text style={styles.eventListName} numberOfLines={1}>{event.name}</Text>
                  <Text style={styles.eventListLocation}>{event.location}</Text>
                </View>
                <Text style={styles.eventListYear}>
                  {event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`}
                </Text>
              </Pressable>
            ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  eraScroller: { marginBottom: 16 },
  eraChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', gap: 6,
  },
  eraChipEmoji: { fontSize: 16 },
  eraChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  mapCard: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  mapContainer: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: MAP_HEIGHT,
  },
  mapPlaceholder: {
    width: '100%',
    height: MAP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  mapLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  mapLegend: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  legendText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  legendCount: { fontSize: 12, color: colors.textSecondary },
  detailCard: { marginBottom: 16 },
  detailName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  detailMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  detailMetaText: { fontSize: 13, color: colors.orange500, fontWeight: '500' },
  detailDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  eventListItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: colors.white, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  eventListItemSelected: { borderColor: colors.orange400, backgroundColor: 'rgba(249,115,22,0.04)' },
  eventListDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  eventListInfo: { flex: 1 },
  eventListName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  eventListLocation: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  eventListYear: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});
