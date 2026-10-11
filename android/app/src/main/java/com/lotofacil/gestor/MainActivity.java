package com.lotofacil.gestor;

import android.content.Context;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        DailyPrizeCheckReceiver.scheduleDaily2155Alarm(this);
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


