import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message = this.state.error.message || 'Unknown error';

    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{this.props.title ?? 'Something went wrong'}</Text>
        <Text style={styles.sub}>
          The app hit an error. Try again. If you use Expo Go, ensure it supports SDK 54 and you are on
          the same Wi‑Fi as your PC.
        </Text>
        <ScrollView style={styles.box}>
          <Text style={styles.mono} selectable>
            {message}
          </Text>
        </ScrollView>
        <Pressable onPress={this.reset} style={styles.btn}>
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    paddingTop: 56,
    backgroundColor: '#fff7fb',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#831843', marginBottom: 8 },
  sub: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 16 },
  box: {
    maxHeight: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mono: { fontSize: 12, color: '#334155', fontFamily: 'monospace' },
  btn: {
    alignSelf: 'center',
    backgroundColor: '#be185d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
