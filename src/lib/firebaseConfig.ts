// Detecção inteligente de plataforma nativa (APK) + Links Externos (Visitante/Comprovante) vs Preview do AI Studio
const getPlatformConfig = () => {
  const isWebEnv =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('googleusercontent.com') ||
      window.location.hostname.includes('localhost'));

  // Libera o banco oficial na Web APENAS para o Link do Visitante (?view=true / /visitante) e Link de Comprovante (?comprovante=1 / /upload-receipt)
  // No Preview normal do AI Studio permanece 100% desligado para não consumir cota!
  const isExternalVisitorOrReceiptLink =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/visitante' ||
      window.location.pathname === '/convite' ||
      window.location.pathname === '/upload-receipt' ||
      window.location.search.includes('view=true') ||
      window.location.search.includes('comprovante=1') ||
      window.location.search.includes('upload=receipt'));

  if (isWebEnv && !isExternalVisitorOrReceiptLink) {
    // Configuração isolada para o Preview Web (não consome a cota do banco oficial)
    return {
      projectId: "adept-figure-463322-r2",
      appId: "1:743166930754:web:3a68e1e19835829d5c22db",
      apiKey: "AIzaSyAvDwqeL3mu-vghn5GKkabuLPChw23BAww",
      authDomain: "adept-figure-463322-r2.firebaseapp.com",
      firestoreDatabaseId: "ai-studio-f7c723d0-2c30-45e0-a501-01ab152f163b",
      storageBucket: "adept-figure-463322-r2.firebasestorage.app",
      messagingSenderId: "743166930754",
      measurementId: "",
      oAuthClientId: "",
      recaptchaSiteKey: ""
    };
  }

  // Configuração oficial do APK Nativo Android (Bolão Amigos), Link do Visitante e Link de Comprovante
  return {
    projectId: "bolao-entre-amigos-78804",
    appId: "1:236236898494:android:99db34cd046957e8f25eef",
    apiKey: "AIzaSyASS1udwCu6mbPJFWZ--5QuZNwcupNzmv8",
    authDomain: "bolao-entre-amigos-78804.firebaseapp.com",
    firestoreDatabaseId: "(default)",
    storageBucket: "bolao-entre-amigos-78804.firebasestorage.app",
    messagingSenderId: "236236898494",
    measurementId: "",
    oAuthClientId: "",
    recaptchaSiteKey: ""
  };
};

export const firebaseConfig = getPlatformConfig();
export default firebaseConfig;




