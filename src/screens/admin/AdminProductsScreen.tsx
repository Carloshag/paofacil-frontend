import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
  TouchableOpacity, Modal, TextInput, ScrollView, Switch, Image, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../config/api';

// A URL base do servidor (sem o /api) para montar a URL das imagens uploadadas
const SERVER_URL = API_URL.replace('/api', '');

const getSecureUri = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('192.168.')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

interface Product {
  id: number;
  nome: string;
  descrição: string;
  preço: number;
  imagem: string;
  porções: string;
  disponível: boolean;
}

const emptyForm = { nome: '', descrição: '', preço: '', imagem: '', porções: '', disponível: true };

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const res = await fetch(`${API_URL}/products/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao buscar produtos.');
      setProducts(await res.json());
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      nome: p.nome,
      descrição: p.descrição || '',
      preço: String(p.preço),
      imagem: p.imagem || '',
      porções: p.porções || '',
      disponível: p.disponível
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    // Solicita permissão de acesso à galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à sua galeria para selecionar uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    await uploadImage(asset.uri);
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');

      // Obtém o nome base do arquivo do URI
      let filename = uri.split('/').pop() ?? 'photo.jpg';
      
      // Remove query parameters se houver (ex: ?alt=media...)
      filename = filename.split('?')[0];

      // Se o arquivo não tiver extensão, adiciona .jpg como padrão
      if (!filename.includes('.')) {
        filename = `${filename}.jpg`;
      }

      // Detecta o tipo de mídia
      const match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Normaliza image/jpg para o padrão image/jpeg
      if (type === 'image/jpg') {
        type = 'image/jpeg';
      }

      const formData = new FormData();
      formData.append('image', { 
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), 
        name: filename, 
        type 
      } as any);

      const res = await fetch(`${API_URL}/products/upload-image`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Erro ao ler resposta do servidor.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar imagem.');
      }

      const secureUrl = getSecureUri(data.url);
      setForm(prev => ({ ...prev, imagem: secureUrl }));
    } catch (err: any) {
      Alert.alert('Erro ao enviar imagem', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.nome || !form.preço) {
      Alert.alert('Atenção', 'Nome e preço são obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('@paofacil:token');
      const body = {
        nome: form.nome,
        descrição: form.descrição,
        preço: parseFloat(form.preço.replace(',', '.')),
        imagem: form.imagem || undefined,
        porções: form.porções || undefined,
        disponível: form.disponível
      };
      const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar produto.');
      }
      setModalVisible(false);
      fetchProducts();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Confirmar', 'Deseja excluir este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@paofacil:token');
            const res = await fetch(`${API_URL}/products/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao excluir.');
            fetchProducts();
          } catch (err: any) {
            Alert.alert('Erro', err.message);
          }
        }
      }
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.8}>
      <View style={styles.cardRow}>
        {item.imagem ? (
          <Image source={{ uri: getSecureUri(item.imagem) }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nome}</Text>
          {item.descrição ? <Text style={styles.cardDesc} numberOfLines={1}>{item.descrição}</Text> : null}
          <View style={styles.cardMeta}>
            <Text style={styles.cardPrice}>R$ {Number(item.preço).toFixed(2).replace('.', ',')}</Text>
            {item.porções ? <Text style={styles.cardServings}>Serve {item.porções}</Text> : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.availBadge, item.disponível ? styles.availOn : styles.availOff]}>
            <Text style={[styles.availText, item.disponível ? styles.availTextOn : styles.availTextOff]}>
              {item.disponível ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIcon}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Produtos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado.</Text>}
          onRefresh={fetchProducts}
          refreshing={loading}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput style={styles.input} value={form.nome} onChangeText={t => setForm({ ...form, nome: t })} placeholder="Ex: Pão Francês" placeholderTextColor="#78716C" />

              <Text style={styles.label}>Descrição</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.descrição} onChangeText={t => setForm({ ...form, descrição: t })} placeholder="Descrição do produto..." placeholderTextColor="#78716C" multiline />

              <Text style={styles.label}>Preço (R$) *</Text>
              <TextInput style={styles.input} value={form.preço} onChangeText={t => setForm({ ...form, preço: t })} placeholder="0,00" placeholderTextColor="#78716C" keyboardType="decimal-pad" />

              {/* Seletor de imagem */}
              <Text style={styles.label}>Foto do Produto</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
                disabled={uploadingImage}
                activeOpacity={0.7}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#D97706" size="small" />
                ) : form.imagem ? (
                  <Image source={{ uri: getSecureUri(form.imagem) }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={32} color="#D97706" />
                    <Text style={styles.imagePlaceholderText}>Toque para selecionar da galeria</Text>
                  </View>
                )}
              </TouchableOpacity>
              {form.imagem ? (
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setForm(prev => ({ ...prev, imagem: '' }))}>
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                  <Text style={styles.removeImageText}>Remover foto</Text>
                </TouchableOpacity>
              ) : null}

              <Text style={styles.label}>Serve quantas pessoas</Text>
              <TextInput style={styles.input} value={form.porções} onChangeText={t => setForm({ ...form, porções: t })} placeholder="Ex: 2-3 pessoas" placeholderTextColor="#78716C" />

              <View style={styles.switchRow}>
                <Text style={styles.labelSwitch}>Disponível para venda</Text>
                <Switch
                  value={form.disponível}
                  onValueChange={v => setForm({ ...form, disponível: v })}
                  trackColor={{ false: '#E7E5E4', true: '#D97706' }}
                  thumbColor={form.disponível ? '#fff' : '#f4f4f4'}
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingProduct ? 'Salvar Alterações' : 'Criar Produto'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: '#292524',
    borderBottomWidth: 1,
    borderColor: '#3E3A38'
  },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addBtn: { backgroundColor: '#D97706', width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#78716C', fontSize: 15 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E7E5E4',
    shadowColor: '#78716C', 
    shadowOpacity: 0.04, 
    shadowRadius: 8, 
    elevation: 1 
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 12, marginRight: 14 },
  thumbPlaceholder: { backgroundColor: '#FAF9F6', borderWidth: 1, borderColor: '#E7E5E4', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#292524', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#78716C', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardPrice: { fontSize: 15, fontWeight: 'bold', color: '#D97706' },
  cardServings: { 
    fontSize: 12, 
    color: '#D97706', 
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6,
    fontWeight: '600'
  },
  cardActions: { alignItems: 'center', gap: 12 },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  availOn: { backgroundColor: '#ECFDF5' },
  availOff: { backgroundColor: '#FEF2F2' },
  availText: { fontSize: 11, fontWeight: 'bold' },
  availTextOn: { color: '#059669' },
  availTextOff: { color: '#DC2626' },
  deleteIcon: { padding: 4 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#292524' },
  closeBtn: { color: '#D97706', fontSize: 16, fontWeight: 'bold' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#78716C', marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelSwitch: { fontSize: 14, fontWeight: 'bold', color: '#292524' },
  input: { 
    backgroundColor: '#FAF9F6', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#E7E5E4',
    color: '#292524'
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtn: { 
    backgroundColor: '#D97706', 
    height: 54, 
    borderRadius: 12, 
    justifyContent: 'center',
    alignItems: 'center', 
    marginTop: 28, 
    marginBottom: 20,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  imagePlaceholder: { alignItems: 'center', padding: 20 },
  imagePlaceholderText: { marginTop: 8, color: '#D97706', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  imagePreview: { width: '100%', height: 180, resizeMode: 'cover' },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-end' },
  removeImageText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
});
