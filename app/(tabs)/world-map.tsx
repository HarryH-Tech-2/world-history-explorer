import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { GlassCard } from '../../src/components/GlassCard';
import { allHistoricalEvents } from '../../src/data/events';
import { ERA_INFO, Era, HistoricalEvent } from '../../src/data/models';
import { colors } from '../../src/theme/colors';
import { UI_IMAGES } from '../../src/data/imageRegistry';

const { width } = Dimensions.get('window');
const MAP_WIDTH = width - 40;
const MAP_HEIGHT = MAP_WIDTH * 0.7;

// Min / max zoom
const MIN_SCALE = 1;
const MAX_SCALE = 4;

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

/**
 * Approximate lat/lng for known locations, mapped to normalised x/y
 * on a simple equirectangular projection (x: 0-1 = -180..180, y: 0-1 = 90..-60).
 */
const LOCATION_COORDS: Record<string, [number, number]> = {
  'Giza, Egypt': [0.587, 0.40],
  'Babylon, Mesopotamia': [0.625, 0.38],
  'Rome, Italy': [0.535, 0.32],
  'Thebes, Egypt': [0.590, 0.42],
  'Kadesh, Syria': [0.600, 0.36],
  'Troy, Anatolia': [0.572, 0.33],
  'Athens, Greece': [0.565, 0.34],
  'Mohenjo-daro, Pakistan': [0.688, 0.42],
  'Anyang, China': [0.810, 0.36],
  'Napata, Nubia': [0.590, 0.48],
  'La Venta, Mexico': [0.240, 0.48],
  'Byblos, Lebanon': [0.600, 0.35],
  'Thermopylae, Greece': [0.562, 0.33],
  'Jerusalem, Judea': [0.597, 0.37],
  'Pompeii, Italy': [0.540, 0.33],
  'Northern China': [0.810, 0.32],
  'Pataliputra, India': [0.735, 0.42],
  'Ravenna, Italy': [0.534, 0.31],
  'Macedon, Greece': [0.563, 0.32],
  "Xi'an, China": [0.802, 0.36],
  'Gandhara, Central Asia': [0.700, 0.36],
  'Tikal, Guatemala': [0.252, 0.48],
  'Baghdad, Iraq': [0.623, 0.38],
  'Hastings, England': [0.502, 0.24],
  'Runnymede, England': [0.498, 0.24],
  'Karakorum, Mongolia': [0.795, 0.28],
  'Messina, Sicily': [0.543, 0.34],
  'Angkor, Cambodia': [0.797, 0.52],
  'Constantinople, Byzantine Empire': [0.578, 0.32],
  "L'Anse aux Meadows, Newfoundland": [0.355, 0.22],
  'Timbuktu, Mali': [0.495, 0.49],
  'Lake Texcoco, Mexico': [0.230, 0.47],
  'Nanjing, China': [0.830, 0.38],
  'Great Zimbabwe, Zimbabwe': [0.585, 0.68],
  'Mainz, Germany': [0.522, 0.27],
  'San Salvador, Bahamas': [0.290, 0.42],
  'Florence, Italy': [0.531, 0.31],
  'Wittenberg, Germany': [0.535, 0.25],
  'Tenochtitlan, Mexico': [0.230, 0.47],
  'Padua, Italy': [0.531, 0.30],
  'Agra, India': [0.720, 0.42],
  'Seville, Spain': [0.484, 0.34],
  'Cusco, Peru': [0.300, 0.60],
  'Beijing, China': [0.822, 0.33],
  'Kyoto, Japan': [0.880, 0.36],
  'Philadelphia, Pennsylvania': [0.292, 0.33],
  'Paris, France': [0.507, 0.27],
  'Saint-Domingue, Haiti': [0.300, 0.46],
  'Vienna, Austria': [0.545, 0.28],
  'London, England': [0.500, 0.24],
  'Birmingham, England': [0.496, 0.24],
  'KwaZulu-Natal, South Africa': [0.585, 0.72],
  'Bogota, Colombia': [0.292, 0.54],
  'Waitangi, New Zealand': [0.970, 0.74],
  'New York, United States': [0.294, 0.32],
  'Peloponnese, Greece': [0.560, 0.34],
  'Ismailia, Egypt': [0.590, 0.39],
  'Sarajevo, Bosnia': [0.550, 0.31],
  'Petrograd, Russia': [0.585, 0.20],
  'Washington, D.C., United States': [0.288, 0.34],
  'Normandy, France': [0.497, 0.27],
  'Hiroshima, Japan': [0.870, 0.36],
  'New Delhi, India': [0.717, 0.40],
  'Berlin, Germany': [0.537, 0.25],
  'Wuhan, China': [0.815, 0.38],
  'Sea of Tranquility, Moon': [0.500, 0.15],
  'Cape Town, South Africa': [0.550, 0.74],
  'New York City, United States': [0.294, 0.32],
  'Low Earth Orbit': [0.500, 0.12],
  'Pretoria, South Africa': [0.578, 0.72],
  'Kigali, Rwanda': [0.580, 0.58],
  'Maastricht, Netherlands': [0.515, 0.25],
};

/** Animated pulsing dot for an event on the map */
function EventDot({
  event,
  x,
  y,
  eraColor,
  isSelected,
  onPress,
}: {
  event: HistoricalEvent;
  x: number;
  y: number;
  eraColor: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isSelected]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.8 }],
    opacity: 0.4 - pulse.value * 0.35,
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={[
        styles.dotTouchable,
        { left: x - 14, top: y - 14 },
      ]}
    >
      {isSelected && (
        <Animated.View
          style={[
            styles.dotPulse,
            { backgroundColor: eraColor },
            pulseStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.dotCore,
          {
            backgroundColor: eraColor,
            borderColor: isSelected ? colors.white : 'rgba(255,255,255,0.8)',
            width: isSelected ? 14 : 10,
            height: isSelected ? 14 : 10,
            borderRadius: isSelected ? 7 : 5,
            borderWidth: isSelected ? 2.5 : 1.5,
          },
        ]}
      />
    </Pressable>
  );
}

export default function WorldMapScreen() {
  const [selectedEra, setSelectedEra] = useState<Era>('modern');
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const mapImage = UI_IMAGES.worldMap;

  const eraRange = ERA_RANGES[selectedEra];
  const filteredEvents = useMemo(
    () => allHistoricalEvents.filter(e => e.year >= eraRange[0] && e.year <= eraRange[1]),
    [selectedEra]
  );

  const eraKeys = Object.keys(ERA_INFO) as Era[];
  const eraColor = ERA_COLORS[selectedEra];

  // -- Gesture state for pinch-to-zoom + pan --
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
    'worklet';
    const maxX = (MAP_WIDTH * (s - 1)) / 2;
    const maxY = (MAP_HEIGHT * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, tx)),
      y: Math.max(-maxY, Math.min(maxY, ty)),
    };
  }, []);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      scale.value = newScale;
      const clamped = clampTranslate(savedTranslateX.value, savedTranslateY.value, newScale);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      const clamped = clampTranslate(
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY,
        scale.value
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.5) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const mapTransformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleSelectEvent = useCallback((event: HistoricalEvent) => {
    setSelectedEvent(prev => prev?.id === event.id ? null : event);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>World Map</Text>
          <Text style={styles.headerSubtitle}>Pinch to zoom, tap events to explore</Text>
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

        {/* Interactive Map */}
        <Animated.View entering={FadeIn.duration(600).delay(200)}>
          <GlassCard style={styles.mapCard} innerStyle={{ padding: 0 }}>
            <View style={styles.mapClip}>
              <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.mapInteractive, mapTransformStyle]}>
                  <Image
                    source={mapImage}
                    style={styles.mapImage}
                    resizeMode="cover"
                  />

                    {/* Event dots overlaid on map */}
                    {filteredEvents.map(event => {
                      const coords = LOCATION_COORDS[event.location];
                      if (!coords) return null;
                      const px = coords[0] * MAP_WIDTH;
                      const py = coords[1] * MAP_HEIGHT;
                      return (
                        <EventDot
                          key={event.id}
                          event={event}
                          x={px}
                          y={py}
                          eraColor={eraColor}
                          isSelected={selectedEvent?.id === event.id}
                          onPress={() => handleSelectEvent(event)}
                        />
                      );
                    })}
                  </Animated.View>
                </GestureDetector>

              {/* Zoom controls */}
              <View style={styles.zoomControls}>
                <Pressable
                  onPress={() => {
                    const newScale = Math.min(MAX_SCALE, scale.value + 0.5);
                    scale.value = withSpring(newScale);
                    savedScale.value = newScale;
                  }}
                  style={styles.zoomButton}
                >
                  <MaterialIcons name="add" size={22} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.zoomDivider} />
                <Pressable
                  onPress={() => {
                    const newScale = Math.max(MIN_SCALE, scale.value - 0.5);
                    scale.value = withSpring(newScale);
                    savedScale.value = newScale;
                    const clamped = clampTranslate(translateX.value, translateY.value, newScale);
                    translateX.value = withSpring(clamped.x);
                    translateY.value = withSpring(clamped.y);
                    savedTranslateX.value = clamped.x;
                    savedTranslateY.value = clamped.y;
                  }}
                  style={styles.zoomButton}
                >
                  <MaterialIcons name="remove" size={22} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.mapLegend}>
              <Text style={styles.legendText}>
                {ERA_INFO[selectedEra].emoji} {ERA_INFO[selectedEra].name} ({ERA_INFO[selectedEra].span})
              </Text>
              <View style={styles.legendRight}>
                <View style={[styles.legendDot, { backgroundColor: eraColor }]} />
                <Text style={styles.legendCount}>{filteredEvents.length} events</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Selected Event Detail */}
        {selectedEvent && (
          <Animated.View entering={SlideInUp.duration(400)}>
            <GlassCard style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={[styles.detailEraDot, { backgroundColor: eraColor }]} />
                <Text style={styles.detailName}>{selectedEvent.name}</Text>
              </View>
              <View style={styles.detailMeta}>
                <MaterialIcons name="calendar-today" size={14} color={colors.orange500} />
                <Text style={styles.detailMetaText}>
                  {selectedEvent.year < 0 ? `${Math.abs(selectedEvent.year)} BCE` : `${selectedEvent.year} CE`}
                </Text>
                <MaterialIcons name="location-on" size={14} color={colors.orange500} style={{ marginLeft: 12 }} />
                <Text style={styles.detailMetaText}>{selectedEvent.location}</Text>
              </View>
              <Text style={styles.detailDescription}>{selectedEvent.description}</Text>
              <View style={styles.funFactBox}>
                <MaterialIcons name="lightbulb" size={16} color={colors.amber500} />
                <Text style={styles.funFactText}>{selectedEvent.funFact}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Event List */}
        <Animated.View entering={FadeIn.duration(600).delay(400)}>
          <Text style={styles.sectionTitle}>Events in this Era</Text>
          {filteredEvents
            .sort((a, b) => a.year - b.year)
            .map(event => {
              const isActive = selectedEvent?.id === event.id;
              return (
                <Pressable
                  key={event.id}
                  onPress={() => handleSelectEvent(event)}
                  style={[
                    styles.eventListItem,
                    isActive && styles.eventListItemSelected,
                  ]}
                >
                  <View style={[styles.eventListDot, { backgroundColor: eraColor }]} />
                  <View style={styles.eventListInfo}>
                    <Text style={[styles.eventListName, isActive && { color: eraColor }]} numberOfLines={1}>
                      {event.name}
                    </Text>
                    <Text style={styles.eventListLocation}>{event.location}</Text>
                  </View>
                  <Text style={[styles.eventListYear, isActive && { color: eraColor }]}>
                    {event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`}
                  </Text>
                </Pressable>
              );
            })}
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

  // Map
  mapCard: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  mapClip: {
    width: '100%',
    height: MAP_HEIGHT,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#E8DCC8',
  },
  mapInteractive: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  mapImage: {
    width: '100%',
    height: '100%',
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

  // Zoom controls
  zoomControls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  // Event dots
  dotTouchable: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dotPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dotCore: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  // Legend
  mapLegend: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)',
  },
  legendText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  legendRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCount: { fontSize: 12, color: colors.textSecondary },

  // Detail card
  detailCard: { marginBottom: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailEraDot: { width: 10, height: 10, borderRadius: 5 },
  detailName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  detailMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  detailMetaText: { fontSize: 13, color: colors.orange500, fontWeight: '500' },
  detailDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: 12 },
  funFactBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.12)',
  },
  funFactText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
    fontStyle: 'italic',
  },

  // Section & event list
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
