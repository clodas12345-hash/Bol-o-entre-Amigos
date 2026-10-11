import firebaseAppletConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: firebaseAppletConfig.projectId || "bolao-entre-amigos-78804",
  appId: firebaseAppletConfig.appId || "1:236236898494:android:99db34cd046957e8f25eef",
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyASS1udwCu6mbPJFWZ--5QuZNwcupNzmv8",
  authDomain: firebaseAppletConfig.authDomain || "bolao-entre-amigos-78804.firebaseapp.com",
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || "(default)",
  storageBucket: firebaseAppletConfig.storageBucket || "bolao-entre-amigos-78804.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "236236898494",
  measurementId: firebaseAppletConfig.measurementId || "",
  oAuthClientId: firebaseAppletConfig.oAuthClientId || "",
  recaptchaSiteKey: firebaseAppletConfig.recaptchaSiteKey || ""
};

export default firebaseConfig;

