// Дизайн-система SMR — монохром (чёрно-белая), шрифт Inter
export const colors = {
  bg: '#FFFFFF',
  bgElevated: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceGrad1: '#FAFAFA',
  surfaceGrad2: '#F4F4F5',
  line: 'rgba(0,0,0,0.12)',
  line2: 'rgba(0,0,0,0.07)',
  chip: '#F1F1F1',
  text: '#0A0A0A',
  textDim: '#5A5A5A',
  textFaint: '#9A9A9A',
  accent: '#0A0A0A',
  accent2: '#333333',
  accentSoft: '#ECECEC',
  live: '#0A0A0A',
  liveSoft: '#ECECEC',
  amber: '#5A5A5A',
  amberSoft: '#F1F1F1',
  olive: '#3A3A3A',
  oliveSoft: '#ECECEC',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

export const space = (n: number) => n * 4;

// Все гарнитуры — Inter. Ключи serif/mono сохранены для совместимости со стилями:
// serif = крупные заголовки (bold), mono = подписи/лейблы (medium), body = текст, med = средний.
export const fonts = {
  serif: 'Inter_700Bold',
  mono: 'Inter_500Medium',
  body: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
};

export const display = (size: number, weight: '700' | '800' | '900' = '700') => ({
  fontFamily: fonts.serif,
  fontSize: size,
  letterSpacing: -size * 0.02,
});

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};
