import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from './theme';

// Екран-оверлей: заʼїжджає справа, підтримує свайп-назад від лівого краю.
// Побудовано на Animated + PanResponder (без нативних модулів → доставляється по OTA).
export default function AnimatedScreen({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (close: () => void) => React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const tx = useRef(new Animated.Value(width)).current;
  const shadow = tx.interpolate({ inputRange: [0, width], outputRange: [0.14, 0], extrapolate: 'clamp' });

  useEffect(() => {
    Animated.timing(tx, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  }, [tx]);

  const close = () => {
    Animated.timing(tx, { toValue: width, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        const startX = g.moveX - g.dx;
        return startX < 40 && g.dx > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4;
      },
      onPanResponderMove: (_e, g) => {
        if (g.dx > 0) tx.setValue(Math.min(g.dx, width));
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx > width * 0.32 || g.vx > 0.5) {
          Animated.timing(tx, { toValue: width, duration: 180, useNativeDriver: true }).start(({ finished }) => finished && onClose());
        } else {
          Animated.spring(tx, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.bg,
          transform: [{ translateX: tx }],
          shadowColor: '#000',
          shadowOpacity: shadow as any,
          shadowRadius: 12,
          shadowOffset: { width: -3, height: 0 },
        },
      ]}
      {...pan.panHandlers}
    >
      {children(close)}
    </Animated.View>
  );
}
