import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { API_URL } from '../config/api';

export default function HomeScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getSecureUri = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('192.168.')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const renderProduct = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
      {item.imagem ? (
        <Image source={{ uri: getSecureUri(item.imagem) }} style={styles.image} />
      ) : (
        <View style={[styles.image, { backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 32 }}>🍞</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: '#1C1917' }]}>{item.nome}</Text>
        <Text style={[styles.desc, { color: '#78716C' }]} numberOfLines={2}>{item.descrição}</Text>
        <Text style={[styles.price, { color: '#D97706' }]}>R$ {Number(item.preço).toFixed(2).replace('.', ',')}</Text>
      </View>
      <TouchableOpacity style={[styles.addButton, { backgroundColor: '#D97706' }]} onPress={() => addToCart(item)} activeOpacity={0.8}>
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#FAFAFA' }]}>
      <View style={[styles.header, { backgroundColor: '#fff', borderBottomColor: '#E2E8F0' }]}>
        <View>
          <Text style={[styles.greeting, { color: '#1B1B1B' }]}>Olá, {user?.name?.split(' ')[0] || 'Cliente'}!</Text>
          <Text style={[styles.subtitle, { color: '#6A6A6A' }]}>O que vamos pedir hoje?</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: '#6A6A6A' }]}>Nenhum produto cadastrado no momento.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1C1917' },
  subtitle: { fontSize: 13, marginTop: 4, color: '#78716C' },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutText: { fontWeight: 'bold' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#78716C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center'
  },
  image: { width: 84, height: 84, borderRadius: 12, marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  price: { fontSize: 16, fontWeight: 'bold' },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addText: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 25 },
  empty: { textAlign: 'center', marginTop: 40 }
});
