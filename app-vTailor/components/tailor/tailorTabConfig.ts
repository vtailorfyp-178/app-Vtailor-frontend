export type TailorTabId = 'home' | 'orders' | 'chat' | 'wallet' | 'profile';

export type TailorTabItem = {
  id: TailorTabId;
  label: string;
  icon: string;
  activeIcon: string;
};

export const TAILOR_TABS: TailorTabItem[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'orders', label: 'Orders', icon: 'cube-outline', activeIcon: 'cube' },
  { id: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', activeIcon: 'wallet' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export const TAILOR_TAB_IDS = new Set<TailorTabId>(TAILOR_TABS.map((t) => t.id));

export function tailorTabFromParam(tab: string | undefined): TailorTabId {
  if (tab && TAILOR_TAB_IDS.has(tab as TailorTabId)) return tab as TailorTabId;
  return 'home';
}

export function tailorTabHref(tabId: TailorTabId): string {
  return tabId === 'home' ? '/tailor' : `/tailor?tab=${tabId}`;
}
