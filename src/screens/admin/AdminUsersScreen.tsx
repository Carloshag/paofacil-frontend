import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar usuários.');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderUser = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nome?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nome}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.badges}>
          <Text style={[styles.badge, item.role === 'admin' ? styles.badgeAdmin : styles.badgeClient]}>
            {item.role === 'admin' ? 'Admin' : 'Cliente'}
          </Text>
          <Text style={[styles.badge, item.is_verified ? styles.badgeVerified : styles.badgeUnverified]}>
            {item.is_verified ? 'Verificado' : 'Pendente'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Usuários Cadastrados</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum usuário encontrado.</Text>}
          onRefresh={fetchUsers}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  pageTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: '#292524', 
    color: '#fff',
    borderBottomWidth: 1,
    borderColor: '#3E3A38'
  },
  list: { padding: 16 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#78716C', 
    shadowOpacity: 0.04, 
    shadowRadius: 8, 
    elevation: 1, 
    alignItems: 'center' 
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#FFFBEB', 
    borderWidth: 1,
    borderColor: '#FEF3C7',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#D97706' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#292524', marginBottom: 2 },
  email: { fontSize: 13, color: '#78716C', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8 },
  badge: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  badgeAdmin: { backgroundColor: '#FEF2F2', color: '#DC2626' },
  badgeClient: { backgroundColor: '#F5F3FF', color: '#6D28D9' },
  badgeVerified: { backgroundColor: '#ECFDF5', color: '#059669' },
  badgeUnverified: { 
    backgroundColor: '#FAF9F6', 
    color: '#78716C',
    borderWidth: 1,
    borderColor: '#E7E5E4'
  },
  empty: { textAlign: 'center', marginTop: 40, color: '#78716C', fontSize: 15 }
});
