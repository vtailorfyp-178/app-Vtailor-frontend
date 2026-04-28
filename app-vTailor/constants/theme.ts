/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
import { ROLE_COLORS } from './ui';

// Accent for light theme (soft rose)
const tintColorLight = ROLE_COLORS.customer.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#0f172a',
    // white app background for most screens
    background: '#ffffff',
    tint: tintColorLight,
    // muted / secondary text
    muted: '#6b7280',
    // card and input backgrounds
    card: '#fff',
    inputBorder: '#f3d1de',
    // button gradient (start, end)
    buttonStart: '#fda4af',
    buttonEnd: '#fb7185',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // circular icon background used for list cards
    iconBg: '#ffd9e6',
    // tailor accent uses light pink consistently
    accentAlt: ROLE_COLORS.tailor.primary,
    iconBgAlt: ROLE_COLORS.tailor.soft,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    // muted / secondary text
    muted: '#9BA1A6',
    // card and input backgrounds
    card: '#0f172a',
    inputBorder: '#2b2f31',
    // button gradient (start, end)
    buttonStart: '#3b3b3b',
    buttonEnd: '#5a5a5a',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // circular icon background used for list cards
    iconBg: '#2a2a2a',
    // tailor accent uses light pink consistently
    accentAlt: ROLE_COLORS.tailor.primary,
    iconBgAlt: '#2a2a2a',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
