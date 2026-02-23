import { useState, useEffect, useRef, useCallback } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MusicTrack {
  id: string;
  name: string;
  file: any; // require() asset
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'iron', name: 'Iron on the Standard', file: require('../../assets/music/iron-on-the-standard.mp3') },
  { id: 'jade', name: 'Jade River Dream', file: require('../../assets/music/jade-river-dream.mp3') },
  { id: 'marble', name: 'Marble And Ember', file: require('../../assets/music/marble-and-ember.mp3') },
];

const STORAGE_KEY = 'music_settings';

interface MusicSettings {
  trackId: string;
  isMuted: boolean;
}

const DEFAULT_SETTINGS: MusicSettings = {
  trackId: 'iron',
  isMuted: false,
};

let globalPlayer: AudioPlayer | null = null;
let globalTrackId: string | null = null;

export function useMusic() {
  const [currentTrackId, setCurrentTrackId] = useState(DEFAULT_SETTINGS.trackId);
  const [isMuted, setIsMuted] = useState(DEFAULT_SETTINGS.isMuted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const mountedRef = useRef(true);

  // Load persisted settings
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const settings: MusicSettings = JSON.parse(raw);
          setCurrentTrackId(settings.trackId);
          setIsMuted(settings.isMuted);
        }
      } catch {}
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Save settings whenever they change
  const saveSettings = useCallback(async (trackId: string, muted: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ trackId, isMuted: muted }));
    } catch {}
  }, []);

  // Load and play a track
  const loadAndPlay = useCallback(async (trackId: string, muted: boolean) => {
    try {
      // Release existing player
      if (globalPlayer) {
        globalPlayer.remove();
        globalPlayer = null;
        globalTrackId = null;
      }

      const track = MUSIC_TRACKS.find(t => t.id === trackId);
      if (!track) return;

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });

      const player = createAudioPlayer(track.file);
      player.loop = true;
      player.volume = muted ? 0 : 0.3;
      player.play();

      globalPlayer = player;
      globalTrackId = trackId;

      if (mountedRef.current) {
        setIsPlaying(true);
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load music:', error);
    }
  }, []);

  // Initialize music on first render
  useEffect(() => {
    const init = async () => {
      // Small delay to avoid blocking app startup
      await new Promise(r => setTimeout(r, 500));

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const settings: MusicSettings = raw ? JSON.parse(raw) : DEFAULT_SETTINGS;

        if (!globalPlayer || globalTrackId !== settings.trackId) {
          await loadAndPlay(settings.trackId, settings.isMuted);
        }
      } catch {}
    };

    init();
  }, [loadAndPlay]);

  const toggleMute = useCallback(async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    saveSettings(currentTrackId, newMuted);

    if (globalPlayer) {
      globalPlayer.volume = newMuted ? 0 : 0.3;
    }
  }, [isMuted, currentTrackId, saveSettings]);

  const selectTrack = useCallback(async (trackId: string) => {
    setCurrentTrackId(trackId);
    saveSettings(trackId, isMuted);
    await loadAndPlay(trackId, isMuted);
  }, [isMuted, saveSettings, loadAndPlay]);

  return {
    currentTrackId,
    isMuted,
    isPlaying,
    isLoaded,
    toggleMute,
    selectTrack,
    tracks: MUSIC_TRACKS,
  };
}
