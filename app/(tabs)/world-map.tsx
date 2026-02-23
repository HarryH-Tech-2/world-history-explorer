import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import Svg, { Path, Circle, G, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { GlassCard } from '../../src/components/GlassCard';
import { allHistoricalEvents } from '../../src/data/events';
import { ERA_INFO, Era, HistoricalEvent } from '../../src/data/models';
import { colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const MAP_WIDTH = width - 40;
const MAP_HEIGHT = MAP_WIDTH * 0.56;

// Simplified continent SVG paths (viewBox 0 0 1000 500)
const CONTINENT_PATHS = {
  northAmerica:
    'M 60,50 Q 80,40 120,38 L 160,42 Q 200,35 230,55 L 245,70 Q 260,90 255,110 L 250,130 Q 245,145 240,160 L 225,180 Q 210,195 195,210 L 175,218 Q 160,222 145,230 L 130,235 Q 115,225 100,218 L 82,205 Q 65,185 55,165 L 45,140 Q 38,115 42,90 L 48,70 Z',
  southAmerica:
    'M 195,245 Q 210,240 225,250 L 240,270 Q 250,290 255,315 L 258,340 Q 255,365 248,388 L 238,408 Q 225,425 215,435 L 205,440 Q 195,438 185,425 L 178,405 Q 172,380 168,355 L 166,330 Q 168,305 172,280 L 180,260 Z',
  europe:
    'M 440,42 Q 460,35 480,38 L 500,42 Q 520,48 535,58 L 545,72 Q 548,85 542,98 L 535,108 Q 525,118 510,125 L 495,128 Q 480,130 465,125 L 452,118 Q 442,108 438,95 L 435,80 Q 435,60 440,42 Z',
  africa:
    'M 455,140 Q 475,135 498,138 L 520,145 Q 540,155 555,172 L 565,192 Q 572,215 575,240 L 575,270 Q 572,298 565,320 L 555,340 Q 540,358 525,368 L 508,375 Q 492,378 478,372 L 465,362 Q 452,345 445,322 L 440,295 Q 438,268 440,240 L 442,215 Q 445,188 448,165 Z',
  asia:
    'M 555,30 Q 590,25 630,28 L 680,35 Q 730,42 775,52 L 815,65 Q 845,78 862,95 L 870,115 Q 872,138 865,158 L 852,175 Q 835,190 812,200 L 785,208 Q 755,212 725,208 L 695,200 Q 665,188 638,172 L 615,155 Q 592,138 575,118 L 562,98 Q 552,78 548,58 L 550,42 Z',
  australia:
    'M 785,305 Q 808,295 835,298 L 860,305 Q 878,315 885,332 L 882,350 Q 872,365 855,372 L 835,375 Q 812,372 798,360 L 788,345 Q 782,328 785,305 Z',
  // Small islands/details
  indonesia:
    'M 780,260 Q 800,255 825,258 L 845,262 Q 855,268 850,275 L 835,278 Q 815,280 795,275 L 782,268 Z',
  greenland:
    'M 265,18 Q 280,12 300,15 L 315,22 Q 322,32 318,42 L 310,48 Q 295,52 280,48 L 270,38 Q 264,28 265,18 Z',
};

const LOCATION_COORDS: Record<string, { x: number; y: number }> = {
  'egypt': { x: 0.53, y: 0.36 },
  'mesopotamia': { x: 0.57, y: 0.32 },
  'babylon': { x: 0.57, y: 0.32 },
  'rome': { x: 0.49, y: 0.26 },
  'italy': { x: 0.49, y: 0.26 },
  'ravenna': { x: 0.49, y: 0.25 },
  'greece': { x: 0.52, y: 0.28 },
  'athens': { x: 0.52, y: 0.28 },
  'china': { x: 0.77, y: 0.30 },
  'beijing': { x: 0.78, y: 0.28 },
  'india': { x: 0.69, y: 0.38 },
  'pataliputra': { x: 0.71, y: 0.36 },
  'japan': { x: 0.87, y: 0.28 },
  'kyoto': { x: 0.87, y: 0.29 },
  'england': { x: 0.46, y: 0.20 },
  'london': { x: 0.46, y: 0.20 },
  'france': { x: 0.47, y: 0.24 },
  'paris': { x: 0.47, y: 0.24 },
  'germany': { x: 0.50, y: 0.22 },
  'berlin': { x: 0.50, y: 0.22 },
  'mainz': { x: 0.49, y: 0.22 },
  'wittenberg': { x: 0.50, y: 0.21 },
  'spain': { x: 0.45, y: 0.28 },
  'mexico': { x: 0.17, y: 0.38 },
  'tenochtitlan': { x: 0.17, y: 0.38 },
  'turkey': { x: 0.55, y: 0.28 },
  'anatolia': { x: 0.55, y: 0.28 },
  'constantinople': { x: 0.54, y: 0.27 },
  'syria': { x: 0.56, y: 0.31 },
  'iraq': { x: 0.57, y: 0.32 },
  'baghdad': { x: 0.57, y: 0.32 },
  'mongolia': { x: 0.74, y: 0.24 },
  'karakorum': { x: 0.74, y: 0.24 },
  'sicily': { x: 0.50, y: 0.30 },
  'messina': { x: 0.50, y: 0.30 },
  'cambodia': { x: 0.78, y: 0.42 },
  'angkor': { x: 0.78, y: 0.42 },
  'bosnia': { x: 0.51, y: 0.26 },
  'sarajevo': { x: 0.51, y: 0.26 },
  'russia': { x: 0.62, y: 0.18 },
  'petrograd': { x: 0.56, y: 0.17 },
  'haiti': { x: 0.22, y: 0.38 },
  'austria': { x: 0.50, y: 0.24 },
  'vienna': { x: 0.50, y: 0.24 },
  'pennsylvania': { x: 0.20, y: 0.28 },
  'philadelphia': { x: 0.20, y: 0.28 },
  'united states': { x: 0.17, y: 0.30 },
  'washington': { x: 0.19, y: 0.28 },
  'new york': { x: 0.21, y: 0.27 },
  'normandy': { x: 0.47, y: 0.23 },
  'hiroshima': { x: 0.85, y: 0.30 },
  'cape town': { x: 0.52, y: 0.64 },
  'south africa': { x: 0.52, y: 0.64 },
  'moon': { x: 0.50, y: 0.08 },
  'low earth orbit': { x: 0.50, y: 0.10 },
  'new delhi': { x: 0.69, y: 0.35 },
  'bahamas': { x: 0.22, y: 0.35 },
  'san salvador': { x: 0.22, y: 0.35 },
  'florence': { x: 0.49, y: 0.27 },
  'padua': { x: 0.49, y: 0.26 },
  'agra': { x: 0.69, y: 0.34 },
  'ismailia': { x: 0.54, y: 0.35 },
  'mali': { x: 0.44, y: 0.40 },
  'timbuktu': { x: 0.44, y: 0.40 },
  'zimbabwe': { x: 0.55, y: 0.58 },
  'peru': { x: 0.22, y: 0.62 },
  'cusco': { x: 0.22, y: 0.62 },
  'newfoundland': { x: 0.25, y: 0.20 },
  'vinland': { x: 0.25, y: 0.20 },
  'strait of magellan': { x: 0.22, y: 0.82 },
  'philippines': { x: 0.82, y: 0.42 },
  'new zealand': { x: 0.92, y: 0.72 },
  'rwanda': { x: 0.54, y: 0.48 },
  'brussels': { x: 0.48, y: 0.22 },
  'nanjing': { x: 0.80, y: 0.30 },
  'caracas': { x: 0.22, y: 0.42 },
  'indus valley': { x: 0.67, y: 0.34 },
  'anyang': { x: 0.79, y: 0.30 },
  'kush': { x: 0.55, y: 0.40 },
  'la venta': { x: 0.16, y: 0.38 },
  'byblos': { x: 0.56, y: 0.30 },
  'macedonia': { x: 0.52, y: 0.27 },
  'xian': { x: 0.77, y: 0.30 },
  'tikal': { x: 0.18, y: 0.40 },
  'birmingham': { x: 0.46, y: 0.20 },
};

function getCoords(location: string): { x: number; y: number } {
  const loc = location.toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COORDS)) {
    if (loc.includes(key)) return val;
  }
  return { x: 0.5, y: 0.4 };
}

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

        {/* SVG Map */}
        <Animated.View entering={FadeIn.duration(600).delay(200)}>
          <GlassCard style={styles.mapCard}>
            <View style={styles.mapContainer}>
              <Svg
                width={MAP_WIDTH - 32}
                height={MAP_HEIGHT}
                viewBox="0 0 1000 500"
                preserveAspectRatio="xMidYMid meet"
              >
                <Defs>
                  <SvgGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#DBEAFE" />
                    <Stop offset="1" stopColor="#EFF6FF" />
                  </SvgGradient>
                  <SvgGradient id="land" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#E8E8E8" />
                    <Stop offset="1" stopColor="#D4D4D4" />
                  </SvgGradient>
                </Defs>

                {/* Ocean */}
                <Rect x="0" y="0" width="1000" height="500" rx="12" fill="url(#ocean)" />

                {/* Grid lines for visual interest */}
                {[100,200,300,400,500,600,700,800,900].map(x => (
                  <Path key={`vg${x}`} d={`M${x},0 L${x},500`} stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                ))}
                {[100,200,300,400].map(y => (
                  <Path key={`hg${y}`} d={`M0,${y} L1000,${y}`} stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                ))}

                {/* Equator */}
                <Path d="M0,250 L1000,250" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="8,4" />

                {/* Continents */}
                <G>
                  <Path d={CONTINENT_PATHS.greenland} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                  <Path d={CONTINENT_PATHS.northAmerica} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                  <Path d={CONTINENT_PATHS.southAmerica} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                  <Path d={CONTINENT_PATHS.europe} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                  <Path d={CONTINENT_PATHS.africa} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                  <Path d={CONTINENT_PATHS.asia} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                  <Path d={CONTINENT_PATHS.indonesia} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                  <Path d={CONTINENT_PATHS.australia} fill="#D1D5DB" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                </G>

                {/* Event dots */}
                {filteredEvents.map(event => {
                  const coords = getCoords(event.location);
                  const isSelected = selectedEvent?.id === event.id;
                  const cx = coords.x * 1000;
                  const cy = coords.y * 500;
                  return (
                    <G key={event.id}>
                      {isSelected && (
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={14}
                          fill={ERA_COLORS[selectedEra]}
                          opacity={0.2}
                        />
                      )}
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 8 : 5}
                        fill={isSelected ? colors.orange500 : ERA_COLORS[selectedEra]}
                        stroke={colors.white}
                        strokeWidth={2}
                        onPress={() => setSelectedEvent(isSelected ? null : event)}
                      />
                    </G>
                  );
                })}
              </Svg>
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
  mapContainer: { width: '100%', padding: 16, paddingBottom: 0 },
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
