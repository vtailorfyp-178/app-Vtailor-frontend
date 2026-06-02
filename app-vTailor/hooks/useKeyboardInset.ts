import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UseKeyboardInsetOptions = {
  /** Space between the keyboard and the input bar. */
  extraOffset?: number;
};

function resolveKeyboardHeight(event: KeyboardEvent): number {
  const { height, screenY } = event.endCoordinates;
  if (height > 0) return height;
  const windowHeight = Dimensions.get('window').height;
  return Math.max(0, windowHeight - screenY);
}

/**
 * Returns bottom padding so sticky inputs sit above the software keyboard
 * on different screen sizes (iOS + Android, including edge-to-edge).
 */
export function useKeyboardInset(options: UseKeyboardInsetOptions = {}) {
  const { extraOffset = 8 } = options;
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onShow = (event: KeyboardEvent) => {
      setKeyboardHeight(resolveKeyboardHeight(event));
    };
    const onHide = () => setKeyboardHeight(0);

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardVisible = keyboardHeight > 0;
  const bottomInset = keyboardVisible
    ? Math.max(0, keyboardHeight - insets.bottom) + extraOffset
    : Math.max(insets.bottom, extraOffset);

  return {
    keyboardHeight,
    keyboardVisible,
    bottomInset,
    safeAreaBottom: insets.bottom,
  };
}
