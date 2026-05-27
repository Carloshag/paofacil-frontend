import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function AddressScreen({ onComplete }: { onComplete: () => void }) {
  const [region, setRegion] = useState({
    latitude: -23.550520,
    longitude: -46.633308,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [addressDetails, setAddressDetails] = useState({
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    cep: ''
  });

  const mapRef = useRef<MapView>(null);

  const geocodeTimer = useRef<NodeJS.Timeout | null>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || ''}&language=pt-BR`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const addressComps = data.results[0].address_components;
        let route = '', neighborhood = '', city = '', zipCode = '', streetNumber = '';
        
        addressComps.forEach((comp: any) => {
          if (comp.types.includes('route')) route = comp.long_name;
          if (comp.types.includes('street_number')) streetNumber = comp.long_name;
          if (comp.types.includes('sublocality') || comp.types.includes('neighborhood') || comp.types.includes('political')) {
            // Keep the first valid neighborhood, as 'political' might capture broad regions if others fail
            if (!neighborhood && comp.types.includes('sublocality')) neighborhood = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_2')) city = comp.long_name;
          if (comp.types.includes('postal_code')) zipCode = comp.long_name;
        });

        // Fallback or explicit neighborhood parsing
        if (!neighborhood) {
          const hoodComp = addressComps.find((c: any) => c.types.includes('sublocality_level_1') || c.types.includes('neighborhood'));
          if (hoodComp) neighborhood = hoodComp.long_name;
        }

        setAddressDetails(prev => ({
          ...prev,
          rua: route || prev.rua,
          numero: streetNumber || prev.numero,
          bairro: neighborhood || prev.bairro,
          cidade: city || prev.cidade,
          cep: zipCode || prev.cep
        }));
      }
    } catch (e) {
      console.log('Reverse geocoding error', e);
    }
  };

  const handleRegionChangeComplete = (r: any) => {
    setRegion(r);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    
    geocodeTimer.current = setTimeout(() => {
      reverseGeocode(r.latitude, r.longitude);
    }, 400);
  };

  const handleSave = async () => {
    if (!addressDetails.rua || !addressDetails.numero) {
      Alert.alert('Atenção', 'Apenas a rua e o número são obrigatórios!');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const response = await fetch(`${API_URL}/users/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...addressDetails,
          lat: region.latitude,
          lng: region.longitude
        })
      });

      if (!response.ok) {
        let errorMsg = 'Falha ao salvar seu endereço.';
        try {
          const resJson = await response.json();
          if (resJson.error) errorMsg = resJson.error;
        } catch(e) {}
        throw new Error(errorMsg);
      }
      Alert.alert('Sucesso!', 'Endereço validado para as próximas entregas!');
      onComplete(); // Tells App.tsx to unmount this screen and show AppNavigator
    } catch (err: any) {
      Alert.alert('Erro do Servidor', err.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior="padding"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Onde vamos entregar? 📍</Text>
        <Text style={styles.subtitle}>Busque pelo mapa ou preencha manualmente</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        <View style={styles.fixedPinContainer} pointerEvents="none">
          <Text style={styles.fixedPin}>📍</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Buscar sua rua, avenida..."
          fetchDetails={true}
          minLength={3}
          debounce={400}
          onPress={(data, details = null) => {
            if (details) {
              const lat = details.geometry.location.lat;
              const lng = details.geometry.location.lng;
              setRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 });
              mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000);
              
              setAddressDetails({
                ...addressDetails,
                rua: data.structured_formatting.main_text,
                bairro: details.address_components.find((c:any) => c.types.includes('sublocality'))?.long_name || '',
                cidade: details.address_components.find((c:any) => c.types.includes('administrative_area_level_2'))?.long_name || '',
                cep: details.address_components.find((c:any) => c.types.includes('postal_code'))?.long_name || ''
              });
            }
          }}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '',
            language: 'pt-BR',
            components: 'country:br',
          }}
          onFail={(error) => {
            console.log('Places API Error:', error);
            Alert.alert('Erro Google Places', JSON.stringify(error) || String(error));
          }}
          keyboardShouldPersistTaps="handled"
          styles={{
            textInput: styles.searchInput,
            listView: { backgroundColor: '#fff', borderRadius: 8, elevation: 4, marginTop: 4 }
          }}
        />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Logradouro</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Avenida Paulista"
          value={addressDetails.rua}
          onChangeText={(val) => setAddressDetails({...addressDetails, rua: val})}
        />
        
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Número</Text>
            <TextInput 
              style={styles.input} 
              placeholder="123"
              keyboardType="numeric"
              value={addressDetails.numero}
              onChangeText={(val) => setAddressDetails({...addressDetails, numero: val})}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Bairro</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Sé"
              value={addressDetails.bairro}
              onChangeText={(val) => setAddressDetails({...addressDetails, bairro: val})}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Confirmar Endereço</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
    zIndex: 2,
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1917' },
  subtitle: { fontSize: 13, color: '#78716C', marginTop: 4 },
  searchContainer: { position: 'absolute', top: 110, left: 16, right: 16, zIndex: 999, elevation: 10 },
  searchInput: { height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#E7E5E4', paddingHorizontal: 16, fontSize: 16, backgroundColor: '#FFFFFF', elevation: 5, shadowColor: '#292524', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6 },
  mapContainer: { flex: 1, zIndex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  fixedPinContainer: { position: 'absolute', zIndex: 2, paddingBottom: 35 },
  fixedPin: { fontSize: 40 },
  form: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#E7E5E4',
    elevation: 10,
    shadowColor: '#292524',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12
  },
  label: { fontSize: 12, fontWeight: 'bold', color: '#78716C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { height: 48, borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 10, paddingHorizontal: 14, marginBottom: 16, fontSize: 16, backgroundColor: '#FAF9F6', color: '#1C1917' },
  row: { flexDirection: 'row' },
  saveBtn: {
    backgroundColor: '#D97706',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});
