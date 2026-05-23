import type { Href } from 'expo-router';

type RouterLike = {
  back: () => void;
  replace: (href: Href) => void;
  canGoBack?: () => boolean;
};

/** Avoid expo-router "GO_BACK was not handled" when stack is empty. */
export function safeRouterBack(router: RouterLike, fallbackHref: Href = '/customer'): void {
  try {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
  } catch {
    /* fall through */
  }
  router.replace(fallbackHref);
}
