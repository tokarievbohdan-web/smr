import { Platform } from 'react-native';

// Дизайн-система PITCH — светлая «газетно-зиновая» тема (hipster editorial)
export const colors = {
  bg: '#F0EBE0',          // тёплый newsprint
  bgElevated: '#FBF8F1',  // приподнятая бумага (превью, иконки)
  surface: '#FBF8F1',     // карточки
  surfaceGrad1: '#FBF8F1',
  surfaceGrad2: '#F0EBE0',
  line: 'rgba(28,25,20,0.14)',
  line2: 'rgba(28,25,20,0.08)',
  chip: '#E7E1D2',        // чипы на бумаге
  text: '#1C1A16',        // тёплый чернильный
  textDim: '#5C554A',
  textFaint: '#948C7C',
  accent: '#2B41D8',      // кобальт (riso-print)
  accent2: '#1F31A8',
  accentSoft: 'rgba(43,65,216,0.12)',
  live: '#E0492A',        // томат — «молния / в эфире»
  liveSoft: 'rgba(224,73,42,0.12)',
  amber: '#B4801C',       // горчица
  amberSoft: 'rgba(180,128,28,0.16)',
  olive: '#5C7A2C',       // олива — «данные»
  oliveSoft: 'rgba(92,122,44,0.15)',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

export const space = (n: number) => n * 4;

// Гарнитуры: сериф для заголовков, моно для подписей/«ньюсвайра»
export const fonts = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, "Times New Roman", serif',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: '"SFMono-Regular", Menlo, "Courier New", monospace',
  }) as string,
};

export const display = (size: number, weight: '700' | '800' | '900' = '800') => ({
  fontFamily: fonts.serif,
  fontSize: size,
  fontWeight: weight as any,
  letterSpacing: -size * 0.015,
});

export const shadow = {
  card: {
    shadowColor: '#1C1A16',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
};
