# 📱 PãoFácil — Aplicativo Mobile

<div align="center">
  <a href="https://reactnative.dev/" target="_blank"><img src="https://img.shields.io/badge/React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" /></a>
  <a href="https://expo.dev/" target="_blank"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://reactnavigation.org/" target="_blank"><img src="https://img.shields.io/badge/React_Navigation-8C4FFF?style=for-the-badge&logo=react-navigation&logoColor=white" alt="React Navigation" /></a>
  <a href="https://socket.io/" target="_blank"><img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" /></a>
</div>

<br />

<div align="center">
  <h3>⚙️ Conheça a API do servidor: <a href="https://github.com/Carloshag/paofacil-backend" target="_blank">PãoFácil Backend</a></h3>
</div>

<br />

O **PãoFácil Mobile** é o aplicativo móvel nativo (iOS & Android) do sistema PãoFácil. Projetado para proporcionar uma experiência fluida, rápida e visualmente incrível, ele permite que clientes naveguem pelo cardápio, façam pedidos, acompanhem entregas e gerenciem seus perfis diretamente do bolso.

Construído utilizando **React Native**, **Expo SDK 54**, **TypeScript** e **React Navigation 7**, o aplicativo conta com integração em tempo real via WebSocket e geolocalização dinâmica.

---

## 📌 Sumário

1. [🌟 Recursos Destacados](#-recursos-destacados)
2. [🛠️ Tecnologias & Arquitetura](#️-tecnologias--arquitetura)
3. [⚙️ Configuração Local (.env)](#️-configuração-local-env)
4. [🚀 Instalação e Inicialização](#-instalação-e-inicialização)
5. [📦 Comandos NPM Disponíveis](#-comandos-npm-disponíveis)
6. [📍 Integração com Google Maps](#-integração-com-google-maps)
7. [🔔 Sistema de Notificações Push](#-sistema-de-notificações-push)
8. [📂 Estrutura de Diretórios](#-estrutura-de-diretórios)

---

## 🌟 Recursos Destacados

- 🛍️ **Fluxo de Compra Intuitivo**: Navegação por categorias de produtos, busca dinâmica, carrinho interativo e checkout simples.
- 📍 **Endereço via Mapa Interativo**: Seleção de endereços usando autocomplete do Google Places e pinagem direta no mapa com `react-native-maps`.
- 🔄 **Status de Pedidos em Tempo Real**: Conexão persistente com WebSocket que exibe alterações de status do pedido sem necessidade de atualizar a tela.
- 🔔 **Notificações em Segundo Plano**: Alertas em tempo real sobre promoções ou atualizações de entrega, mesmo com o app fechado.
- 👤 **Perfis & Histórico**: Visualização rápida de compras passadas e dados cadastrais.
- 🛡️ **Painel do Administrador Integrado**: Telas administrativas exclusivas protegidas por controle de acesso (RBAC) para gerenciar produtos, estoques e despachar pedidos diretamente de um celular administrador.

---

## 🛠️ Tecnologias & Arquitetura

* **Framework Base:** React Native & Expo (v54.0)
* **Linguagem:** TypeScript (Tipagem estática estrita em 100% das telas)
* **Navegação:** React Navigation v7 (Stack & Bottom Tabs compostos e fluidos)
* **Armazenamento Local:** AsyncStorage (Persistência segura de tokens e sessão do usuário)
* **Mapas & Lugares:** `react-native-maps` e `react-native-google-places-autocomplete`
* **Realtime Client:** Socket.io-client (Conexão otimizada e com reconexão inteligente)

---

## ⚙️ Configuração Local (.env)

O aplicativo utiliza variáveis de ambiente sob o prefixo `EXPO_PUBLIC_` para carregar segredos em tempo de build de forma segura. 

Crie um arquivo `.env` na raiz do diretório `paofacil-frontend` baseado no `.env.example`:

```env
# APIs do Google (Android & iOS)
EXPO_PUBLIC_GOOGLE_MAPS_KEY=sua_chave_do_google_maps_aqui
```

### 🌐 Conectando à API Backend

As conexões de requisição HTTP e WebSockets apontam para o arquivo de configuração localizado em:
`src/config/api.ts`

Por padrão, está configurado para a API de produção:
```typescript
export const API_URL = 'https://paofacil-backend.onrender.com/api';
```

> [!TIP]
> Se quiser testar o aplicativo apontando para o seu **Backend rodando localmente na mesma rede Wi-Fi**, altere essa constante em `src/config/api.ts` para o IP da sua máquina local na rede (ex: `http://192.168.0.x:3000/api`). *Nota: Não use `localhost` ou `127.0.0.1` se estiver rodando o aplicativo em um celular físico, pois o celular não conseguirá se conectar.*

---

## 🚀 Instalação e Inicialização

Siga o guia passo a passo para testar o aplicativo localmente:

### 1. Pré-requisitos
* **Node.js** (v18+) instalado na máquina de desenvolvimento.
* Aplicativo **Expo Go** instalado no seu smartphone físico (disponível gratuitamente na [App Store](https://apps.apple.com/br/app/expo-go/id984023395) ou [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)).

### 2. Acessar o Diretório e Instalar
```bash
cd paofacil-frontend
npm install
```

### 3. Iniciar o Servidor Bundler do Expo
```bash
npm start
```

### 4. Abrir no Celular Físico
1. Com o bundler rodando, um **QR Code** gigante aparecerá no seu terminal.
2. **No Android**: Abra o app *Expo Go* e toque em "Scan QR Code".
3. **No iOS**: Abra o aplicativo nativo da *Câmera*, aponte para o QR Code e clique no link de abertura sugerido.
4. O Expo fará o download e compilação rápida do JavaScript via Wi-Fi e o app abrirá perfeitamente!

---

## 📦 Comandos NPM Disponíveis

No terminal rodando o bundler ou diretamente pelos scripts npm:

- `npm start`: Inicia o servidor de desenvolvimento do Metro Bundler.
- `npm run android`: Inicia o app em um emulador Android ativo (requer Android Studio).
- `npm run ios`: Inicia o app no simulador iOS local (exclusivo para macOS com Xcode).
- `npm run web`: Executa a versão web adaptada no navegador para testes de layout rápidos.

---

## 📍 Configuração de Geolocalização (Google Maps)

O aplicativo utiliza as APIs de mapas nativos:
1. **Google Maps SDK** para Android.
2. **Apple Maps** no iOS (ou Google Maps caso configurado).

Certifique-se de que a sua chave de API do Google Maps possua os seguintes serviços ativados no Google Cloud Console:
- *Maps SDK for Android*
- *Maps SDK for iOS*
- *Places API*
- *Geocoding API*

---

## 🔔 Sistema de Notificações Push

As notificações push são nativas e gerenciadas pelo módulo `expo-notifications`. 
Ao abrir o aplicativo pela primeira vez, ele solicitará permissão ao usuário. Caso concedida, um token único é gerado e registrado no perfil do usuário no nosso backend. O painel administrativo pode disparar atualizações que se tornarão banners de notificação instantâneos no dispositivo do usuário final.

---

## 📂 Estrutura de Diretórios

```text
paofacil-frontend/
├── assets/             # Imagens estáticas, logotipos, fontes e splash screens
├── src/
│   ├── config/         # Configurações de API e chaves globais
│   ├── contexts/       # Contextos do React (AuthContext com sessão persistente)
│   ├── screens/        # Telas divididas por domínio (Admin, Client, Auth, Common)
│   │   ├── admin/      # Telas de controle do administrador (pedidos, produtos)
│   │   ├── client/     # Telas do fluxo do cliente final (cardápio, carrinho, histórico)
│   │   ├── auth/       # Telas de Login, Cadastro e Recuperação de Senha
│   │   └── common/     # Telas comuns (Ex: Splash ou Erros)
│   ├── services/       # Serviços externos (socketService de websocket, geolocalização)
│   ├── types/          # Arquivos de definição de tipos TypeScript (.ts)
│   └── App.tsx         # Ponto central e roteador principal de navegação do App
├── app.json            # Configuração nativa de metadados do Expo
├── eas.json            # Configurações de builds automatizadas na nuvem
├── tsconfig.json       # Definições do compilador TypeScript
└── package.json        # Dependências e scripts npm
```

---

Feito com ☕ e muito sabor! 🥖
