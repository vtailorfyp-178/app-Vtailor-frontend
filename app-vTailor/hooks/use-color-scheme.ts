// Force the app to always use the light color scheme so system dark mode
// does not affect the app's fixed whitish-pink theme.
export function useColorScheme(): 'light' | 'dark' | null {
	return 'light';
}
