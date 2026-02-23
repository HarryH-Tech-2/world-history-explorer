import React from 'react';
import { View, Image, StyleSheet, Text, ImageSourcePropType } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface EventImageProps {
  imageSource: ImageSourcePropType | null;
  isLoading?: boolean;
}

export function EventImage({ imageSource, isLoading }: EventImageProps) {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.placeholder}>
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      ) : imageSource ? (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons name="image" size={64} color="rgba(249,115,22,0.3)" />
          <Text style={styles.placeholderText}>What historical event is this?</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(249,115,22,0.2)',
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.surface,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
