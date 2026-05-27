import React from 'react';
import { View, TextInput } from 'react-native';

export const GooglePlacesAutocomplete = ({ placeholder, styles: customStyles }: any) => (
  <View>
    <TextInput
      style={customStyles?.textInput}
      placeholder={placeholder}
      editable={false}
    />
  </View>
);

export default GooglePlacesAutocomplete;
