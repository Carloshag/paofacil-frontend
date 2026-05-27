import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import AddressScreen from './src/screens/AddressScreen';
import { API_URL } from './src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const { login, register, verify, resendVerificationCode, requestPasswordReset, resetPassword, isLoading, error, requiresVerification, setRequiresVerification } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const handleResendCode = async () => {
    setLocalError(null);
    try {
      await resendVerificationCode(email);
      Alert.alert('Código Reenviado!', 'Um novo código de verificação foi enviado para o seu e-mail.');
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao reenviar código.');
    }
  };
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);
    try {
      if (isResettingPassword) {
        if (password !== confirmPassword) {
          setLocalError('As senhas não coincidem!');
          return;
        }
        await resetPassword(email, code, password);
        setIsResettingPassword(false);
        setIsForgotPassword(false);
        setPassword('');
        setConfirmPassword('');
        setCode('');
      } else if (isForgotPassword) {
        if (!email) {
          setLocalError('Preencha seu e-mail.');
          return;
        }
        await requestPasswordReset(email);
        setIsResettingPassword(true);
      } else if (requiresVerification) {
        await verify(email, code);
      } else if (isRegister) {
        if (password !== confirmPassword) {
          setLocalError('As senhas não coincidem!');
          return;
        }
        await register(`${name} ${surname}`.trim(), email, password);
      } else {
        await login(email, password);
      }
    } catch {

    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#292524' }]} // Deep warm charcoal
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image source={require('./assets/logo1.png')} style={{ width: 260, height: 260, marginBottom: -10 }} resizeMode="contain" />
        </View>

        <View style={styles.formContainer}>
          {requiresVerification ? (
            <View style={styles.verificationContainer}>
              <Text style={[styles.verifText, { color: '#E7E5E4' }]}>Enviamos um código de 6 dígitos para o e-mail: {email}</Text>
              <TextInput
                style={[styles.input, styles.codeInput, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#D97706' }]}
                placeholder="000000"
                placeholderTextColor="#A8A29E"
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity 
                onPress={handleResendCode} 
                style={styles.resendCodeButton}
                disabled={isLoading}
              >
                <Text style={[styles.resendCodeText, { color: '#FEF3C7' }]}>Não recebeu? Reenviar código</Text>
              </TouchableOpacity>
            </View>
          ) : isResettingPassword ? (
            <View style={styles.verificationContainer}>
              <Text style={[styles.verifText, { color: '#E7E5E4' }]}>Enviamos um código de recuperação para: {email}</Text>
              <TextInput
                style={[styles.input, styles.codeInput, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#D97706', height: 52, letterSpacing: 5, fontSize: 18 }]}
                placeholder="Código"
                placeholderTextColor="#A8A29E"
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TextInput
                style={[styles.input, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4', marginBottom: 16 }]}
                placeholder="Nova Senha"
                placeholderTextColor="#A8A29E"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={[styles.input, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4', marginBottom: 16 }]}
                placeholder="Confirmar Nova Senha"
                placeholderTextColor="#A8A29E"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          ) : isForgotPassword ? (
            <>
              <Text style={[styles.verifText, { color: '#E7E5E4', marginBottom: 24, fontSize: 16 }]}>Digite seu e-mail para recuperar a senha.</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4' }]}
                placeholder="E-mail"
                placeholderTextColor="#A8A29E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </>
          ) : (
            <>
              {isRegister && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4' }]}
                    placeholder="Nome"
                    placeholderTextColor="#A8A29E"
                    value={name}
                    onChangeText={setName}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4' }]}
                    placeholder="Sobrenome"
                    placeholderTextColor="#A8A29E"
                    value={surname}
                    onChangeText={setSurname}
                  />
                </View>
              )}
              <TextInput
                style={[styles.input, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4' }]}
                placeholder="E-mail"
                placeholderTextColor="#A8A29E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={[styles.input, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4' }]}
                placeholder="Senha"
                placeholderTextColor="#A8A29E"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              {isRegister && (
                <TextInput
                  style={[styles.input, { backgroundColor: '#FFF', color: '#1C1917', borderColor: '#E7E5E4' }]}
                  placeholder="Confirmar Senha"
                  placeholderTextColor="#A8A29E"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              )}
            </>
          )}

          {(localError || error) && <Text style={[styles.errorText, { color: '#F87171' }]}>{localError || error}</Text>}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled, { backgroundColor: '#D97706' }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isResettingPassword ? 'Redefinir Senha' : isForgotPassword ? 'Enviar Código' : requiresVerification ? 'Validar Código' : (isRegister ? 'Criar conta' : 'Entrar')}
              </Text>
            )}
          </TouchableOpacity>

          {!requiresVerification && !isForgotPassword && !isResettingPassword && (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.toggleButton}>
                <Text style={[styles.toggleText, { color: '#FEF3C7', fontWeight: 'bold' }]}>
                  {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
                </Text>
              </TouchableOpacity>
              {!isRegister && (
                <TouchableOpacity onPress={() => setIsForgotPassword(true)} style={{ marginTop: 12, paddingVertical: 8 }}>
                  <Text style={[styles.toggleText, { color: '#E7E5E4' }]}>
                    Esqueci minha senha
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {(requiresVerification || isForgotPassword || isResettingPassword) && (
            <TouchableOpacity onPress={() => {
              setRequiresVerification(false);
              setIsForgotPassword(false);
              setIsResettingPassword(false);
            }} style={styles.toggleButton}>
              <Text style={[styles.toggleText, { color: '#FEF3C7', fontWeight: 'bold' }]}>Voltar para o Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const MainApp = () => {
  const { user, logout } = useAuth();
  const [checkingAddress, setCheckingAddress] = useState(true);
  const [needsAddress, setNeedsAddress] = useState(false);

  React.useEffect(() => {
    if (user) {
      setCheckingAddress(true);
      AsyncStorage.getItem('@paofacil:token').then(token => {
        if (!token) {
          logout();
          setCheckingAddress(false);
          return;
        }

        fetch(`${API_URL}/users/address`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (res.status === 401) {
              console.warn('Token inválido (401). Fazendo logout automático.');
              logout();
              return { isError: true };
            }
            if (!res.ok) {
              console.error('Erro ao verificar endereço:', res.status);
              setNeedsAddress(true);
              return { isError: true };
            }
            return res.json();
          })
          .then(data => {
            if (data && data.isError) return;
            if (!data || !data.rua) {
              setNeedsAddress(true);
            } else {
              setNeedsAddress(false);
            }
          })
          .catch((err) => {
            console.error('Erro ao buscar endereço:', err);
            setNeedsAddress(true);
          })
          .finally(() => setCheckingAddress(false));
      });
    } else {
      setCheckingAddress(false);
    }
  }, [user]);

  if (checkingAddress && user) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}><ActivityIndicator size="large" color="#D97706" /></View>;
  }

  if (user) {
    if (needsAddress) {
      return <AddressScreen onComplete={() => setNeedsAddress(false)} />;
    }
    return (
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    );
  }

  return <LoginScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 20 },
  emoji: { fontSize: 60, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  formContainer: { width: '100%', paddingHorizontal: 4 },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#44403C',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAF9F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    height: 64,
  },
  verificationContainer: { marginBottom: 8 },
  verifText: { textAlign: 'center', marginBottom: 20, fontSize: 15, lineHeight: 22 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  button: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  toggleButton: { marginTop: 12, alignItems: 'center' },
  toggleText: { fontSize: 14, fontWeight: '500' },
  resendCodeButton: { paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  resendCodeText: { fontSize: 14, fontWeight: '600' }
});
