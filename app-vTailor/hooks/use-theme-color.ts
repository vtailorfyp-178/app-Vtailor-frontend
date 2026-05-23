/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { ROLE_COLORS } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const { userRole } = useAuth();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else if (theme === 'light' && colorName === 'tint' && userRole === 'tailor') {
    return ROLE_COLORS.tailor.primary;
  } else {
    return Colors[theme][colorName];
  }
}
