import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Легкий fade + підйом при зміні контенту (для перемикання табів)
export default function FadeView({ dep, children }: { dep: any; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    opacity.setValue(0);
    ty.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [dep, opacity, ty]);

  return <Animated.View style={{ flex: 1, opacity, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}
