import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../contexts/CartContext';
import { API_URL } from '../config/api';

export default function CartScreen({ navigation }: any) {
  const { items, total, updateQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'entrega' | 'retirada'>('entrega');
  const [estimate, setEstimate] = useState<{ distance: string; duration: string; storeAddress: string } | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');

  useEffect(() => {
    if (deliveryMethod === 'entrega' && items.length > 0) {
      setLoadingEstimate(true);
      setEstimateError(null);
      AsyncStorage.getItem('@paofacil:token').then(token => {
        fetch(`${API_URL}/users/delivery-estimate`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
          if (data.duration) {
            setEstimate(data);
            setEstimateError(null);
          } else {
            setEstimate(null);
            setEstimateError(data.error || 'Erro desconhecido');
          }
        })
        .catch(() => { setEstimate(null); setEstimateError('Erro de conexão'); })
        .finally(() => setLoadingEstimate(false));
      });
    } else {
      setEstimate(null);
      setEstimateError(null);
    }
  }, [deliveryMethod, items.length]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const orderData = {
        tipo_entrega: deliveryMethod,
        forma_pagamento: paymentMethod,
        observações: '',
        items: items.map(item => ({
          product_id: item.product.id,
          quantidade: item.quantity
        }))
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao finalizar pedido.');
      }

      Alert.alert('Sucesso!', 'Seu pedido foi recebido pela padaria e está na fila!');
      clearCart();
      navigation.navigate('Pedidos');
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.product.nome}</Text>
        <Text style={styles.price}>R$ {Number(item.product.preço).toFixed(2).replace('.', ',')}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
          <Text style={styles.qtyText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
          <Text style={styles.qtyText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Carrinho</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.product.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Seu carrinho está vazio.</Text>}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Opção de Entrega:</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity 
                style={[styles.toggleBtn, deliveryMethod === 'entrega' && styles.toggleBtnActive]}
                onPress={() => setDeliveryMethod('entrega')}
              >
                <Text style={[styles.toggleBtnText, deliveryMethod === 'entrega' && styles.toggleBtnTextActive]}>Entregar em Casa</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, deliveryMethod === 'retirada' && styles.toggleBtnActive]}
                onPress={() => setDeliveryMethod('retirada')}
              >
                <Text style={[styles.toggleBtnText, deliveryMethod === 'retirada' && styles.toggleBtnTextActive]}>Retirada no Balcão</Text>
              </TouchableOpacity>
            </View>
          </View>

          {deliveryMethod === 'entrega' && (
            <View style={styles.estimateBox}>
              {loadingEstimate ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : estimate ? (
                <>
                  <Text style={styles.estimateTitle}>Estimativa de Entrega</Text>
                  <Text style={styles.estimateText}>⏱ {estimate.duration} • {estimate.distance}</Text>
                  <Text style={styles.estimateStore}>Saída: {estimate.storeAddress}</Text>
                </>
              ) : estimateError ? (
                <Text style={styles.estimateError}>{estimateError}</Text>
              ) : (
                <Text style={styles.estimateText}>Calculando...</Text>
              )}
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Forma de Pagamento:</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity 
                style={[styles.payBtn, paymentMethod === 'pix' && styles.payBtnActive]}
                onPress={() => setPaymentMethod('pix')}
              >
                <Text style={styles.payIcon}>📱</Text>
                <Text style={[styles.payBtnText, paymentMethod === 'pix' && styles.payBtnTextActive]}>Pix</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.payBtn, paymentMethod === 'dinheiro' && styles.payBtnActive]}
                onPress={() => setPaymentMethod('dinheiro')}
              >
                <Text style={styles.payIcon}>💵</Text>
                <Text style={[styles.payBtnText, paymentMethod === 'dinheiro' && styles.payBtnTextActive]}>Dinheiro</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.payBtn, paymentMethod === 'cartao' && styles.payBtnActive]}
                onPress={() => setPaymentMethod('cartao')}
              >
                <Text style={styles.payIcon}>💳</Text>
                <Text style={[styles.payBtnText, paymentMethod === 'cartao' && styles.payBtnTextActive]}>Cartão</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, loading && { opacity: 0.7 }]}
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Finalizar Pedido</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1917' },
  list: { padding: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#78716C' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#1C1917' },
  price: { color: '#D97706', fontWeight: 'bold' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 34, height: 34, backgroundColor: '#F5F5F4', borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E7E5E4' },
  qtyText: { fontSize: 18, fontWeight: 'bold', color: '#1C1917' },
  qtyValue: { marginHorizontal: 16, fontSize: 16, fontWeight: 'bold', color: '#1C1917' },
  footer: { padding: 24, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E7E5E4' },
  toggleContainer: { marginBottom: 16 },
  toggleLabel: { fontSize: 14, fontWeight: 'bold', color: '#78716C', marginBottom: 8 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E7E5E4', alignItems: 'center', backgroundColor: '#FAFAF9' },
  toggleBtnActive: { backgroundColor: '#FFFBEB', borderColor: '#D97706', borderWidth: 1.5 },
  toggleBtnText: { fontSize: 14, color: '#78716C', fontWeight: '600' },
  toggleBtnTextActive: { color: '#D97706', fontWeight: 'bold' },
  estimateBox: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 10, padding: 12, marginBottom: 16 },
  estimateTitle: { fontSize: 14, fontWeight: 'bold', color: '#065F46', marginBottom: 4 },
  estimateText: { fontSize: 15, color: '#047857', fontWeight: 'bold' },
  estimateError: { fontSize: 13, color: '#DC2626' },
  estimateStore: { fontSize: 12, color: '#78716C', marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1C1917' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#D97706' },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E7E5E4', alignItems: 'center', backgroundColor: '#FAFAF9' },
  payBtnActive: { backgroundColor: '#FFFBEB', borderColor: '#D97706', borderWidth: 1.5 },
  payIcon: { fontSize: 20, marginBottom: 4 },
  payBtnText: { fontSize: 12, color: '#78716C', fontWeight: '600' },
  payBtnTextActive: { color: '#D97706', fontWeight: 'bold' },
  checkoutBtn: {
    backgroundColor: '#D97706',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});
