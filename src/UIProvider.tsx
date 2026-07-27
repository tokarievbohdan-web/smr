import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from './theme';
import { Button, PrimaryCTA, SecondaryCTA, status } from './ui';
import { useAuth as useAuthCore } from './AuthContext';

type Tone = keyof typeof status;
type Ctx = {
  toast: (msg: string, tone?: Tone) => void;
  openSheet: (node: React.ReactNode) => void;
  closeSheet: () => void;
  openModal: (node: React.ReactNode) => void;
  closeModal: () => void;
  confirm: (o: { title: string; message?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }) => void;
  auth: { isAuthed: boolean; signIn: () => void; signOut: () => void; requireAuth: (fn: () => void) => void };
};

const UICtx = createContext<Ctx>(null as any);
export const useUI = () => useContext(UICtx);
export const useToast = () => useUI().toast;
export const useSheet = () => { const u = useUI(); return { open: u.openSheet, close: u.closeSheet }; };
export const useModal = () => { const u = useUI(); return { open: u.openModal, close: u.closeModal }; };
export const useConfirm = () => useUI().confirm;
export const useAuth = () => useUI().auth;

export function UIProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const core = useAuthCore();
  const authedForActions = !!core.user && !core.isGuest;
  const [sheet, setSheet] = useState<React.ReactNode>(null);
  const [modal, setModal] = useState<React.ReactNode>(null);
  const [toastState, setToastState] = useState<{ msg: string; tone: Tone } | null>(null);

  const sheetY = useRef(new Animated.Value(height)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const toastA = useRef(new Animated.Value(0)).current;

  const openSheet = useCallback((node: React.ReactNode) => {
    setSheet(node);
    sheetY.setValue(height);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, bounciness: 2, speed: 16 }),
    ]).start();
  }, [backdrop, sheetY, height]);
  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: height, duration: 200, useNativeDriver: true }),
    ]).start(() => setSheet(null));
  }, [backdrop, sheetY, height]);

  const openModal = useCallback((node: React.ReactNode) => {
    setModal(node);
    Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [backdrop]);
  const closeModal = useCallback(() => {
    Animated.timing(backdrop, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setModal(null));
  }, [backdrop]);

  const toast = useCallback((msg: string, tone: Tone = 'neutral') => {
    setToastState({ msg, tone });
    toastA.setValue(0);
    Animated.sequence([
      Animated.spring(toastA, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
      Animated.delay(1900),
      Animated.timing(toastA, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastState(null));
  }, [toastA]);

  const confirm = useCallback((o: { title: string; message?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }) => {
    openModal(
      <View style={{ gap: 8 }}>
        <Text style={styles.confirmTitle}>{o.title}</Text>
        {o.message ? <Text style={styles.confirmMsg}>{o.message}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1 }}><SecondaryCTA label="Скасувати" onPress={() => closeModal()} /></View>
          <View style={{ flex: 1 }}><Button full label={o.confirmLabel || 'Підтвердити'} variant={o.danger ? 'danger' : 'primary'} onPress={() => { closeModal(); o.onConfirm(); }} /></View>
        </View>
      </View>
    );
  }, [openModal, closeModal]);

  const requireAuth = useCallback((fn: () => void) => {
    if (authedForActions) return fn();
    core.promptSignIn();
  }, [authedForActions, core]);

  const value: Ctx = {
    toast, openSheet, closeSheet, openModal, closeModal, confirm,
    auth: { isAuthed: authedForActions, signIn: core.promptSignIn, signOut: core.signOut, requireAuth },
  };

  return (
    <UICtx.Provider value={value}>
      {children}

      {/* Overlay host */}
      {(sheet || modal) && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]} pointerEvents="auto">
          <TouchableWithoutFeedback onPress={() => (modal ? closeModal() : closeSheet())}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      {modal && (
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={styles.modalCard}>{modal}</View>
        </View>
      )}

      {sheet && (
        <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space(5)), transform: [{ translateY: sheetY }] }]}>
          <View style={styles.grabber} />
          {sheet}
        </Animated.View>
      )}

      {toastState && (
        <Animated.View
          style={[styles.toast, { bottom: insets.bottom + 80, opacity: toastA, transform: [{ translateY: toastA.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
          pointerEvents="none"
        >
          <View style={[styles.toastDot, { backgroundColor: status[toastState.tone].fg }]} />
          <Text style={styles.toastText}>{toastState.msg}</Text>
        </Animated.View>
      )}
    </UICtx.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(16,18,24,0.45)', zIndex: 40 },
  modalWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: space(6), zIndex: 50 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: colors.bg, borderRadius: radius.card, padding: space(5) },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: space(5), paddingTop: 12, zIndex: 50 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 16 },
  confirmTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  confirmMsg: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 20 },
  authIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', left: space(5), right: space(5), backgroundColor: colors.dark, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 60 },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  toastText: { fontFamily: fonts.semi, color: '#fff', fontSize: 13.5, flex: 1 },
});
