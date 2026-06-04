export type CustomerTabId = 'home' | 'orders' | 'chat' | 'wallet' | 'profile';

export type CustomerTabItem = {
  id: CustomerTabId;
  label: string;
  icon: string;
  activeIcon: string;
};

export const CUSTOMER_TABS: CustomerTabItem[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'orders', label: 'Orders', icon: 'cube-outline', activeIcon: 'cube' },
  { id: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet-outline', activeIcon: 'wallet' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export const CUSTOMER_TAB_IDS = new Set<CustomerTabId>(CUSTOMER_TABS.map((t) => t.id));

export function customerTabFromParam(tab: string | undefined): CustomerTabId {
  if (tab && CUSTOMER_TAB_IDS.has(tab as CustomerTabId)) return tab as CustomerTabId;
  return 'home';
}

export function customerTabHref(tabId: CustomerTabId): string {
  return tabId === 'home' ? '/customer' : `/customer?tab=${tabId}`;
}
