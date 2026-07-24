// Дизайн-система SMR — Sport Market Review
// Бренд: кислотно-жёлтый #DEDE19 + чёрный, шрифт Inter, фирменные градиенты
export const colors = {
  bg: '#FFFFFF',
  bgElevated: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceGrad1: '#FAFAF5',
  surfaceGrad2: '#F1F1EA',
  line: 'rgba(17,17,18,0.12)',
  line2: 'rgba(17,17,18,0.07)',
  chip: '#F1F1EC',
  text: '#111112',
  textDim: '#5A5A56',
  textFaint: '#9A9A92',
  accent: '#DEDE19',        // фирменный жёлтый — только как ЗАЛИВКА (текст поверх — onAccent)
  accent2: '#C9C912',
  accentSoft: 'rgba(222,222,25,0.20)',
  onAccent: '#111112',      // текст/иконки на жёлтом
  live: '#DEDE19',          // «Молния»
  liveSoft: 'rgba(222,222,25,0.20)',
  amber: '#5A5A56',
  amberSoft: '#F1F1EC',
  olive: '#3A3A38',
  oliveSoft: '#EDEDE8',
  green: '#00AF50',
  pink: '#FF014A',
};

// Фирменные градиенты (для expo-linear-gradient — массив цветов)
export const gradients = {
  yellowBlack: ['#DEDE19', '#121211'] as const,
  spectrum: ['#FF014A', '#DEDE19', '#00AF50'] as const,
  lavenderYellow: ['#D6CCEF', '#DEDE19'] as const,
  yellowGreen: ['#DEDE19', '#00AF50'] as const,
  greenDark: ['#002400', '#00AF50'] as const,
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

export const space = (n: number) => n * 4;

// Гарнитуры — Inter. serif = заголовки (bold), black = лого/дисплей (extrabold),
// mono = подписи/лейблы (medium), body = текст.
export const fonts = {
  serif: 'Inter_700Bold',
  black: 'Inter_800ExtraBold',
  mono: 'Inter_500Medium',
  body: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
};

export const display = (size: number) => ({
  fontFamily: fonts.black,
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
