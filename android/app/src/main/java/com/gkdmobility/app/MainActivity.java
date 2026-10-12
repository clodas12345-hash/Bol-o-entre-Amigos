package com.gkdmobility.app;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.lotofacil.gestor.DailyPrizeCheckReceiver;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Inicialização de segurança redundante do FirebaseApp antes do ciclo de vida da Activity
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this);
            }
        } catch (Exception e) {
            try {
                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setApplicationId("1:236236898494:android:99db34cd046957e8f25eef")
                        .setApiKey("AIzaSyASS1udwCu6mbPJFWZ--5QuZNwcupNzmv8")
                        .setProjectId("bolao-entre-amigos-78804")
                        .setGcmSenderId("236236898494")
                        .setStorageBucket("bolao-entre-amigos-78804.firebasestorage.app")
                        .build();
                FirebaseApp.initializeApp(this, options);
            } catch (Exception ignored) {
            }
        }

        super.onCreate(savedInstanceState);

        try {
            DailyPrizeCheckReceiver.scheduleDaily2155Alarm(this);
        } catch (Exception ignored) {
        }

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().addJavascriptInterface(new BolaoNativeUserBridge(this), "BolaoNativeUser");
            }
        } catch (Exception ignored) {
        }
    }

    public static class BolaoNativeUserBridge {
        private final Context context;

        public BolaoNativeUserBridge(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public void setUserName(String name) {
            if (name == null) return;
            context.getSharedPreferences("bolao_native_2155_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putString("user_display_name", name.trim())
                    .apply();
        }
    }
}
