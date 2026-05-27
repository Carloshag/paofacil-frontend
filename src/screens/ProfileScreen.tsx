import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AddressScreen from './AddressScreen';
import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [address, setAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  const fetchAddress = async () => {
    setLoadingAddress(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const response = await fetch(`${API_URL}/users/address`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAddress(data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, []);

  if (editingAddress) {
    return <AddressScreen onComplete={() => {
      setEditingAddress(false);
      fetchAddress();
    }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Meu Perfil</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        
        
        <View style={styles.addressCard}>
          <Text style={styles.addressTitle}>{user?.role === 'admin' ? 'Endereço da Loja' : 'Endereço de Entrega'}</Text>
          {loadingAddress ? (
            <ActivityIndicator color="#D97706" />
          ) : address && address.rua ? (
            <>
              <Text style={styles.addressLine}>{address.rua}, {address.numero}</Text>
              <Text style={styles.addressLine}>{address.bairro} - {address.cidade}</Text>
              <Text style={styles.addressLine}>CEP: {address.cep}</Text>
            </>
          ) : (
            <Text style={styles.addressLine}>Nenhum endereço cadastrado</Text>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditingAddress(true)}>
            <Text style={styles.editBtnText}>{user?.role === 'admin' ? 'Definir Endereço da Loja' : 'Editar Endereço'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  scrollContent: { paddingBottom: 40 },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
    color: '#1C1917',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#D97706' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1C1917', marginBottom: 4 },
  email: { fontSize: 16, color: '#78716C', marginBottom: 8 },
  addressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  addressTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1917', marginBottom: 12 },
  addressLine: { fontSize: 15, color: '#78716C', marginBottom: 4 },
  editBtn: { marginTop: 14, alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 12, borderRadius: 10 },
  editBtnText: { color: '#D97706', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { marginHorizontal: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' }
});
