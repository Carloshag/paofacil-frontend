import React from 'react';
import { View } from 'react-native';

const MapView = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }, style]}>
    {children}
  </View>
);

const Marker = ({ children }: any) => <View>{children}</View>;
const Callout = ({ children }: any) => <View>{children}</View>;
const Polyline = () => null;
const Polygon = () => null;

export default MapView;
export { Marker, Callout, Polyline, Polygon };
