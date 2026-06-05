import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, type KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type UseKeyboardInsetOptions = {
  /** Idle bottom padding when the keyboard is hidden (uses safe area if larger). */
  extraOffset?: number;
  /** Gap between the keyboard top edge and the sticky input bar when typing. */
  keyboardGap?: number;
};

/** Padding so a bottom input sits just above the software keyboard. */
export function computeInputPaddingBottom(
  keyboardVisible: boolean,
  keyboardHeight: number,
  safeAreaBottom: number,
  idlePadding: number,
  keyboardGap = 10,
  androidWindowResized = false,
): number {
  if (!keyboardVisible) {
    return idlePadding;
  }

  // Android adjustResize already shrinks the window — only add a small cosmetic gap.
  if (Platform.OS === 'android' && androidWindowResized) {
    return Math.max(10, safeAreaBottom + keyboardGap);
  }

  // iOS, or Android when the window did not resize (keyboard overlays content).
  const lift = keyboardHeight - safeAreaBottom - keyboardGap;
  return Math.max(keyboardGap, lift);
}

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
  const { extraOffset = 8, keyboardGap = 10 } = options;
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [androidWindowResized, setAndroidWindowResized] = useState(false);
  const baselineWindowHeightRef = useRef(Dimensions.get('window').height);
  const keyboardVisibleRef = useRef(false);

  useEffect(() => {
    const onShow = (event: KeyboardEvent) => {
      const height = resolveKeyboardHeight(event);
      keyboardVisibleRef.current = true;
      setKeyboardHeight(height);

      if (Platform.OS === 'android') {
        const detectResize = () => {
          const currentWindowHeight = Dimensions.get('window').height;
          const baseline = baselineWindowHeightRef.current;
          // adjustResize lowers window height when the keyboard opens.
          const shrunk = baseline - currentWindowHeight > Math.max(72, height * 0.25);
          setAndroidWindowResized(shrunk);
        };
        detectResize();
        requestAnimationFrame(detectResize);
        setTimeout(detectResize, 80);
      }
    };

    const onHide = () => {
      keyboardVisibleRef.current = false;
      setKeyboardHeight(0);
      setAndroidWindowResized(false);
      baselineWindowHeightRef.current = Dimensions.get('window').height;
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    const dimensionSub = Dimensions.addEventListener('change', ({ window }) => {
      if (!keyboardVisibleRef.current) {
        baselineWindowHeightRef.current = window.height;
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      dimensionSub.remove();
    };
  }, []);

  const keyboardVisible = keyboardHeight > 0;
  const idlePadding = Math.max(insets.bottom, extraOffset);
  const bottomInset = keyboardVisible
    ? Math.max(0, keyboardHeight - insets.bottom) + extraOffset
    : idlePadding;
  const inputPaddingBottom = computeInputPaddingBottom(
    keyboardVisible,
    keyboardHeight,
    insets.bottom,
    idlePadding,
    keyboardGap,
    androidWindowResized,
  );

  return {
    keyboardHeight,
    keyboardVisible,
    bottomInset,
    inputPaddingBottom,
    safeAreaBottom: insets.bottom,
    androidWindowResized,
  };
}
