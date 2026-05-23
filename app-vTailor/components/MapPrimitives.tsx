import React from 'react';
import { View } from 'react-native';

type AnyProps = Record<string, any>;

const MapView = React.forwardRef<any, AnyProps>(({ children, ...props }, _ref) => {
  return <View {...props}>{children}</View>;
});

MapView.displayName = 'MapViewFallback';

export function Marker({ children }: AnyProps) {
  return <>{children}</>;
}

export default MapView;