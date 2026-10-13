package com.bolaoamigos.app;

import android.app.Application;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

/**
 * Classe Application personalizada que garante a inicialização antecipada
 * e infalível do FirebaseApp no processo com.bolaoamigos.app antes de qualquer
 * chamada de plugins do Capacitor como PushNotifications.register().
 */
public class MainApplication extends Application {
    private static final String TAG = "MainApplication";

    @Override
    public void onCreate() {
        super.onCreate();
        initializeFirebase();
    }

    private void initializeFirebase() {
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this);
                Log.i(TAG, "FirebaseApp inicializado com sucesso via google-services.json.");
            } else {
                Log.i(TAG, "FirebaseApp já se encontra inicializado.");
            }
        } catch (Exception e) {
            Log.w(TAG, "Inicialização padrão do FirebaseApp não encontrou recursos, executando fallback programático: " + e.getMessage());
            try {
                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setApplicationId("1:236236898494:android:99db34cd046957e8f25eef")
                        .setApiKey("AIzaSyASS1udwCu6mbPJFWZ--5QuZNwcupNzmv8")
                        .setProjectId("bolao-entre-amigos-78804")
                        .setGcmSenderId("236236898494")
                        .setStorageBucket("bolao-entre-amigos-78804.firebasestorage.app")
                        .build();
                FirebaseApp.initializeApp(this, options);
                Log.i(TAG, "FirebaseApp inicializado com sucesso via fallback programático!");
            } catch (Exception ex) {
                Log.e(TAG, "Erro crítico ao inicializar Firebase: " + ex.getMessage(), ex);
            }
        }
    }
}
