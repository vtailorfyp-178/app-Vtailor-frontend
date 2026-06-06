export type AdminTabId = 'home' | 'users' | 'orders' | 'profile';

export type AdminTabItem = {
  id: AdminTabId;
  label: string;
  icon: string;
  activeIcon: string;
};

export const ADMIN_TABS: AdminTabItem[] = [
  { id: 'home', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { id: 'users', label: 'Users', icon: 'people-outline', activeIcon: 'people' },
  { id: 'orders', label: 'Orders', icon: 'cube-outline', activeIcon: 'cube' },
  { id: 'profile', label: 'Account', icon: 'person-outline', activeIcon: 'person' },
];

export const ADMIN_TAB_IDS = new Set<AdminTabId>(ADMIN_TABS.map((t) => t.id));

export function adminTabFromParam(tab: string | undefined): AdminTabId {
  if (tab && ADMIN_TAB_IDS.has(tab as AdminTabId)) return tab as AdminTabId;
  return 'home';
}

export function adminTabHref(tabId: AdminTabId): string {
  return tabId === 'home' ? '/admin' : `/admin?tab=${tabId}`;
}
