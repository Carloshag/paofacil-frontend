import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import { connectSocket, getSocket } from '../../services/socketService';

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrderBadge, setNewOrderBadge] = useState(0);

  const deleteOrder = async (orderId: number) => {
    Alert.alert('Confirmação', 'Tem certeza que quer excluir este pedido? Ele sumirá para o cliente também.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@paofacil:token');
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao excluir pedido.');
            setSelectedOrder(null);
            fetchAllOrders();
          } catch (err: any) {
            Alert.alert('Erro', err.message);
          }
        }
      }
    ]);
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const response = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar pedidos dos clientes.');
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();

    // Conexão socket para novos pedidos em tempo real
    let mounted = true;
    const setupSocket = async () => {
      const socket = await connectSocket();
      socket.on('new_order', (order: any) => {
        if (!mounted) return;
        setOrders(prev => [order, ...prev]);
        setNewOrderBadge(prev => prev + 1);
      });
    };
    setupSocket();

    return () => {
      mounted = false;
      const socket = getSocket();
      socket?.off('new_order');
    };
  }, []);

  const changeStatus = async (orderId: number, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'delivering';
    else if (currentStatus === 'delivering') nextStatus = 'done';
    else return;

    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error('Falha ao atualizar status.');

      fetchAllOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const renderOrder = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedOrder(item)} activeOpacity={0.8}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Pedido #{item.id}</Text>
          <Text style={styles.clientName}>{item.user?.nome} ({item.user?.email})</Text>
        </View>
        <View style={styles.statusBox}>
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
      </View>

      <View style={styles.items}>
        {item.items?.map((oi: any) => (
          <Text key={oi.id} style={styles.itemText}>{oi.quantidade}x {oi.product?.nome}</Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>R$ {Number(item.total).toFixed(2).replace('.', ',')}</Text>
        <Text style={styles.dateText}>
          {new Date(item.created_at || item.createdAt).toLocaleDateString('pt-BR')} {new Date(item.created_at || item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Gestão de Pedidos</Text>
        {newOrderBadge > 0 && (
          <TouchableOpacity
            style={styles.badge}
            onPress={() => setNewOrderBadge(0)}
            activeOpacity={0.7}
          >
            <Text style={styles.badgeText}>{newOrderBadge} novo{newOrderBadge > 1 ? 's' : ''}</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido recebido ainda.</Text>}
          onRefresh={fetchAllOrders}
          refreshing={loading}
        />
      )}

      {selectedOrder && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setSelectedOrder(null)}>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pedido #{selectedOrder.id}</Text>
                <TouchableOpacity onPress={() => setSelectedOrder(null)}><Text style={styles.closeBtnText}>Fechar</Text></TouchableOpacity>
              </View>

              <Text style={styles.clientInfo}>Cliente: {selectedOrder.user?.nome} ({selectedOrder.user?.email})</Text>
              <Text style={styles.paymentInfo}>
                💳 Pagamento: {selectedOrder.forma_pagamento === 'pix' ? 'Pix' : selectedOrder.forma_pagamento === 'dinheiro' ? 'Dinheiro' : selectedOrder.forma_pagamento === 'cartao' ? 'Cartão' : selectedOrder.forma_pagamento || 'Não informado'}
              </Text>

              {selectedOrder.tipo_entrega !== 'retirada' && selectedOrder.user?.Addresses && selectedOrder.user.Addresses.length > 0 ? (
                <View style={styles.mapWrap}>
                  <Text style={styles.mapTitle}>Endereço p/ Entrega:</Text>
                  <Text style={styles.addressText}>
                    {selectedOrder.user.Addresses[0].rua}, {selectedOrder.user.Addresses[0].numero} - {selectedOrder.user.Addresses[0].bairro}
                  </Text>
                  <MapView
                    style={styles.modalMap}
                    initialRegion={{
                      latitude: selectedOrder.user.Addresses[0].lat,
                      longitude: selectedOrder.user.Addresses[0].lng,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005
                    }}
                  >
                    <Marker coordinate={{ latitude: selectedOrder.user.Addresses[0].lat, longitude: selectedOrder.user.Addresses[0].lng }} />
                  </MapView>
                </View>
              ) : (
                <View style={styles.mapWrap}>
                  <Text style={styles.mapTitle}>Retirada no Balcão</Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedOrder.status !== 'done' && (
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      selectedOrder.status === 'pending' ? styles.btnPending :
                        selectedOrder.status === 'preparing' ? styles.btnPreparing : styles.btnDelivering
                    ]}
                    onPress={() => changeStatus(selectedOrder.id, selectedOrder.status)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.primaryBtnText,
                      selectedOrder.status === 'pending' ? styles.btnTextPending :
                        selectedOrder.status === 'preparing' ? styles.btnTextPreparing : styles.btnTextDelivering
                    ]}>
                      {selectedOrder.status === 'pending' ? 'Iniciar Preparo' :
                        selectedOrder.status === 'preparing' ? 'Preparo Finalizado' : 'Entrega Realizada'}
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedOrder.status === 'done' && (
                  <View style={[styles.primaryBtn, styles.btnDone]}>
                    <Text style={[styles.primaryBtnText, styles.btnTextDone]}>✓ Pedido Concluído</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.deleteIconBtn} onPress={() => deleteOrder(selectedOrder.id)}>
                  <Ionicons name="trash-outline" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#292524', 
    paddingRight: 20, 
    paddingTop: 60, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#3E3A38'
  },
  pageTitle: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, color: '#fff' },
  badge: { backgroundColor: '#D97706', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  list: { padding: 16 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E7E5E4',
    shadowColor: '#78716C', 
    shadowOpacity: 0.04, 
    shadowRadius: 8, 
    elevation: 1 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#292524' },
  clientName: { fontSize: 13, color: '#78716C', marginTop: 2 },
  statusBox: { alignItems: 'flex-end' },
  status: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  statusPending: { backgroundColor: '#FEF3C7', color: '#D97706' },
  statusPrep: { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  statusDelivering: { backgroundColor: '#F5F3FF', color: '#6D28D9' },
  statusDone: { backgroundColor: '#ECFDF5', color: '#059669' },
  items: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E7E5E4' },
  itemText: { fontSize: 14, color: '#78716C', marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 16, fontWeight: 'bold', color: '#292524' },
  dateText: { fontSize: 12, color: '#78716C' },
  empty: { textAlign: 'center', marginTop: 40, color: '#78716C', fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: 'rgba(41, 37, 36, 0.4)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24, 
    maxHeight: '90%',
    shadowColor: '#292524',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#292524' },
  closeBtnText: { color: '#D97706', fontSize: 16, fontWeight: 'bold', padding: 4 },
  clientInfo: { fontSize: 16, color: '#292524', marginBottom: 6, fontWeight: '500' },
  paymentInfo: { 
    fontSize: 13, 
    color: '#059669', 
    backgroundColor: '#ECFDF5', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    alignSelf: 'flex-start',
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  mapWrap: { marginBottom: 20 },
  mapTitle: { fontSize: 14, fontWeight: 'bold', color: '#78716C', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressText: { fontSize: 15, color: '#292524', marginBottom: 12 },
  modalMap: { height: 180, width: '100%', borderRadius: 16, borderWidth: 1, borderColor: '#E7E5E4' },
  modalActions: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
  primaryBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: 'bold' },
  btnPending: { backgroundColor: '#FEF3C7' },
  btnTextPending: { color: '#D97706' },
  btnPreparing: { backgroundColor: '#EFF6FF' },
  btnTextPreparing: { color: '#1D4ED8' },
  btnDelivering: { backgroundColor: '#F5F3FF' },
  btnTextDelivering: { color: '#6D28D9' },
  btnDone: { backgroundColor: '#ECFDF5' },
  btnTextDone: { color: '#059669' },
  deleteIconBtn: { backgroundColor: '#FEF2F2', height: 52, width: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});
