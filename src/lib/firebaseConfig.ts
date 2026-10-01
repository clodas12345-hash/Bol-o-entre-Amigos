// Detecção inteligente de plataforma nativa (APK) vs visualização Web
const getPlatformConfig = () => {
  const isNative = typeof window !== 'undefined' && 
    (window.location.protocol === 'capacitor:' || 
     window.location.protocol === 'ionic:' || 
     window.location.protocol === 'file:' || 
     (window as any).Capacitor?.isNativePlatform?.() || 
     window.navigator?.userAgent?.includes('Android') || 
     window.navigator?.userAgent?.includes('Capacitor'));

  if (isNative) {
    // Configuração oficial de produção utilizada APENAS pelo aplicativo instalado (APK)
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
  }

  // Configuração simulada/mock para a visualização WEB no navegador (100% desconectada do banco oficial)
  return {
    projectId: "bolao-web-desconectado-fake",
    appId: "1:000000000000:web:0000000000000000000000",
    apiKey: "AIzaSyFakeKey_NavegadorWebDesconectadoDoBancoOficial",
    authDomain: "bolao-web-desconectado-fake.firebaseapp.com",
    firestoreDatabaseId: "(default)",
    storageBucket: "bolao-web-desconectado-fake.appspot.com",
    messagingSenderId: "000000000000",
    measurementId: "",
    oAuthClientId: "",
    recaptchaSiteKey: ""
  };
};

export const firebaseConfig = getPlatformConfig();

export default firebaseConfig;
