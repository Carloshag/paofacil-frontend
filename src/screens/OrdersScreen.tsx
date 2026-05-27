import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const endpoint = user?.role === 'admin' ? '/orders' : '/orders/my';
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar pedidos.');
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Conexão socket para atualizações em tempo real
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      const socket = await connectSocket();
      socket.on('order_status_changed', ({ orderId, status }: { orderId: number; status: string }) => {
        if (!mounted) return;
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status } : o))
        );
      });
    };

    setupSocket();

    return () => {
      mounted = false;
      const socket = getSocket();
      socket?.off('order_status_changed');
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );


  const renderOrder = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>
          Pedido #{item.id} {user?.role === 'admin' && item.user ? `- ${item.user.nome}` : ''}
        </Text>
        <Text style={[styles.status, 
          item.status === 'done' ? styles.statusDone : 
          item.status === 'delivering' ? styles.statusDelivering :
          item.status === 'preparing' ? styles.statusPrep : styles.statusPending
        ]}>
          {item.status === 'pending' ? 'Aguardando' : 
           item.status === 'preparing' ? 'Preparando' : 
           item.status === 'delivering' ? 'Saiu p/ Entrega' : 'Concluído'}
        </Text>
      </View>
      <View style={styles.items}>
        {item.items?.map((oi: any) => (
          <Text key={oi.id} style={styles.itemText}>{oi.quantidade}x {oi.product?.nome}</Text>
        ))}
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.total}>Total: R$ {Number(item.total).toFixed(2).replace('.', ',')}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at || item.createdAt).toLocaleDateString('pt-BR')} {new Date(item.created_at || item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Meus Pedidos</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Você ainda não fez nenhum pedido.</Text>}
          onRefresh={fetchOrders}
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
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1C1917' },
  status: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  statusPending: { backgroundColor: '#FEF3C7', color: '#D97706' },
  statusPrep: { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  statusDelivering: { backgroundColor: '#F5F3FF', color: '#6D28D9' },
  statusDone: { backgroundColor: '#ECFDF5', color: '#047857' },
  items: { marginBottom: 12 },
  itemText: { fontSize: 14, color: '#78716C', marginBottom: 3 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 16, fontWeight: 'bold', color: '#1C1917' },
  dateText: { fontSize: 12, color: '#78716C' },
  error: { color: '#DC2626', textAlign: 'center', marginTop: 40, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 40, color: '#78716C' }
});
