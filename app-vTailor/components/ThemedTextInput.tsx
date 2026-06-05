import React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { TEXT_DARK } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

/**
 * TextInput with explicit text/placeholder colors so typed text stays visible
 * on Android when the device uses dark mode (native theme) or edge-to-edge layouts.
 */
export const ThemedTextInput = React.forwardRef<TextInput, TextInputProps>(function ThemedTextInput(
  { style, placeholderTextColor, ...rest },
  ref,
) {
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? muted}
      style={[
        styles.base,
        {
          color: text || TEXT_DARK,
          backgroundColor: card,
          borderColor: inputBorder,
        },
        style,
      ]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    fontSize: 16,
  },
});
