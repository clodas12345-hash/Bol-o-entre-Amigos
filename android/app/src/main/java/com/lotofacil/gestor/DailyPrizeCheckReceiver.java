package com.lotofacil.gestor;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;

/**
 * Executa a conferência automática dos jogos do dia às 21:55 no Android,
 * mesmo quando o aplicativo está 100% fechado ou após reiniciar o aparelho.
 * Caso encontre aposta premiada no concurso do dia, exibe imediatamente uma
 * notificação nativa de parabéns pelo prêmio e registra no Firestore para todos os membros.
 */
public class DailyPrizeCheckReceiver extends BroadcastReceiver {
    private static final String TAG = "DailyPrizeCheck";
    private static final String CHANNEL_ID = "padrao";
    private static final String PROJECT_ID = "bolao-entre-amigos-78804";
    private static final String FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents";
    private static final int ALARM_REQUEST_CODE = 215500;

    public static void scheduleDaily2155Alarm(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, DailyPrizeCheckReceiver.class);
            intent.setAction("com.lotofacil.gestor.ACTION_DAILY_PRIZE_CHECK_2155");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, ALARM_REQUEST_CODE, intent, flags);

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 21);
            cal.set(Calendar.MINUTE, 55);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);

            if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                cal.add(Calendar.DAY_OF_MONTH, 1);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pendingIntent);
                } catch (SecurityException se) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pendingIntent);
                }
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pendingIntent);
            }

            Log.i(TAG, "Alarme diário das 21:55 agendado para: " + cal.getTime());
        } catch (Exception e) {
            Log.w(TAG, "Erro ao agendar alarme das 21:55: " + e.getMessage());
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        // Reagenda imediatamente para o dia seguinte às 21:55
        scheduleDaily2155Alarm(context);

        String action = intent != null ? intent.getAction() : "";
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            return;
        }

        final PendingResult pendingResult = goAsync();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wakeLock = pm != null
                ? pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BolaoAmigos::PrizeCheck2155WakeLock")
                : null;
        if (wakeLock != null) {
            wakeLock.acquire(45000L);
        }

        new Thread(() -> {
            try {
                checkLotteryAndNotify(context.getApplicationContext(), "lotofacil");
                checkLotteryAndNotify(context.getApplicationContext(), "megasena");
            } catch (Exception e) {
                Log.w(TAG, "Erro na conferência automática das 21:55: " + e.getMessage());
            } finally {
                if (wakeLock != null && wakeLock.isHeld()) {
                    try { wakeLock.release(); } catch (Exception ignored) {}
                }
                pendingResult.finish();
            }
        }).start();
    }

    private void checkLotteryAndNotify(Context context, String lotteryType) {
        try {
            JSONObject caixaResult = fetchLatestCaixaResult(lotteryType);
            if (caixaResult == null) return;

            int contest = caixaResult.optInt("contest", 0);
            JSONArray drawnArr = caixaResult.optJSONArray("numbers");
            if (contest <= 0 || drawnArr == null || drawnArr.length() == 0) return;

            Set<Integer> drawnSet = new HashSet<>();
            for (int i = 0; i < drawnArr.length(); i++) {
                drawnSet.add(drawnArr.optInt(i));
            }

            List<List<Integer>> gamesForContest = fetchGamesForContestFromFirestore(contest);
            if (gamesForContest.isEmpty()) return;

            int winningCount = 0;
            double totalPrize = 0.0;
            int highestHits = 0;

            boolean isMega = "megasena".equals(lotteryType);
            double prize11 = 7.0;
            double prize12 = 14.0;
            double prize13 = 35.0;
            double prize14 = caixaResult.optDouble("prize14Amount", 1500.0);
            double prize15 = caixaResult.optDouble("prize15Amount", 1500000.0);

            double prize4 = caixaResult.optDouble("prize4Amount", 1000.0);
            double prize5 = caixaResult.optDouble("prize5Amount", 45000.0);
            double prize6 = caixaResult.optDouble("prize6Amount", 50000000.0);

            for (List<Integer> gameNums : gamesForContest) {
                int hits = 0;
                for (Integer n : gameNums) {
                    if (drawnSet.contains(n)) hits++;
                }

                if (!isMega && hits >= 11) {
                    winningCount++;
                    if (hits > highestHits) highestHits = hits;
                    if (hits == 11) totalPrize += prize11;
                    else if (hits == 12) totalPrize += prize12;
                    else if (hits == 13) totalPrize += prize13;
                    else if (hits == 14) totalPrize += prize14;
                    else if (hits >= 15) totalPrize += prize15;
                } else if (isMega && hits >= 4) {
                    winningCount++;
                    if (hits > highestHits) highestHits = hits;
                    if (hits == 4) totalPrize += prize4;
                    else if (hits == 5) totalPrize += prize5;
                    else if (hits >= 6) totalPrize += prize6;
                }
            }

            if (winningCount > 0 && totalPrize > 0) {
                NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
                String formattedPrize = nf.format(totalPrize);
                String lotLabel = isMega ? "Mega-Sena" : "Lotofácil";

                String prefsName = "bolao_native_2155_prefs";
                String savedUserName = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
                        .getString("user_display_name", "");
                String personGreeting = (savedUserName != null && !savedUserName.trim().isEmpty())
                        ? savedUserName.trim()
                        : "Amigo(a)";

                // Título e mensagem personalizados com o nome da pessoa no aparelho
                String localTitle = "🏆 Parabéns, " + personGreeting + "! Aposta Premiada (#" + contest + ")!";
                String localBody = winningCount > 1
                        ? "🎉 Parabéns, " + personGreeting + "! Tivemos " + winningCount + " apostas premiadas no Concurso #" + contest + " (" + lotLabel + ") somando " + formattedPrize + " (Maior acerto: " + highestHits + " pontos)!"
                        : "🎉 Parabéns, " + personGreeting + "! Tivemos 1 aposta premiada no Concurso #" + contest + " (" + lotLabel + ") no valor de " + formattedPrize + " (" + highestHits + " pontos)!";

                // Para o Firestore (que é lido por todos os membros), salvamos com marcador {name} para que cada membro veja seu próprio nome
                String firestoreTitle = "🏆 Parabéns, {name}! Aposta Premiada (#" + contest + ")!";
                String firestoreBody = winningCount > 1
                        ? "🎉 Parabéns, {name}! Tivemos " + winningCount + " apostas premiadas no Concurso #" + contest + " (" + lotLabel + ") somando " + formattedPrize + " (Maior acerto: " + highestHits + " pontos)!"
                        : "🎉 Parabéns, {name}! Tivemos 1 aposta premiada no Concurso #" + contest + " (" + lotLabel + ") no valor de " + formattedPrize + " (" + highestHits + " pontos)!";

                String notifiedKey = "notified_win_" + lotteryType + "_" + contest;
                boolean alreadyNotifiedOnDevice = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
                        .getBoolean(notifiedKey, false);

                if (!alreadyNotifiedOnDevice) {
                    context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
                            .edit()
                            .putBoolean(notifiedKey, true)
                            .apply();

                    showNativeCongratulationsNotification(context, localTitle, localBody, 900000 + contest);
                    writeNotificationToFirestoreIfNeeded(contest, firestoreTitle, firestoreBody);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Erro ao verificar " + lotteryType + ": " + e.getMessage());
        }
    }

    private JSONObject fetchLatestCaixaResult(String lotteryType) {
        String[] urls = new String[]{
                "https://servicebus2.caixa.gov.br/portaldeloterias/api/" + lotteryType + "/",
                "https://loteriascaixa-api.herokuapp.com/api/" + lotteryType + "/latest"
        };

        for (String endpoint : urls) {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(endpoint);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14)");

                if (conn.getResponseCode() != 200) continue;

                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject data = new JSONObject(sb.toString());
                JSONArray rawDezenas = data.optJSONArray("listaDezenas");
                if (rawDezenas == null) rawDezenas = data.optJSONArray("dezenas");
                if (rawDezenas == null || rawDezenas.length() == 0) continue;

                JSONArray numbers = new JSONArray();
                for (int i = 0; i < rawDezenas.length(); i++) {
                    numbers.put(Integer.parseInt(rawDezenas.optString(i).trim()));
                }

                int contestNum = data.optInt("numero", data.optInt("concurso", 0));
                if (contestNum <= 0) continue;

                JSONObject res = new JSONObject();
                res.put("contest", contestNum);
                res.put("numbers", numbers);

                JSONArray rateioList = data.optJSONArray("listaRateioPremio");
                if (rateioList == null) rateioList = data.optJSONArray("premiacoes");
                if (rateioList != null) {
                    for (int i = 0; i < rateioList.length(); i++) {
                        JSONObject p = rateioList.optJSONObject(i);
                        if (p == null) continue;
                        String faixa = (p.optString("descricaoFaixa", "") + " " + p.optString("descricao", "")).toLowerCase();
                        double val = p.optDouble("valorPremio", p.optDouble("valor", 0.0));
                        if (faixa.contains("15") || faixa.contains("1º")) res.put("prize15Amount", val);
                        else if (faixa.contains("14") || faixa.contains("2º")) res.put("prize14Amount", val);
                        else if (faixa.contains("6") || faixa.contains("sena")) res.put("prize6Amount", val);
                        else if (faixa.contains("5") || faixa.contains("quina")) res.put("prize5Amount", val);
                        else if (faixa.contains("4") || faixa.contains("quadra")) res.put("prize4Amount", val);
                    }
                }
                return res;
            } catch (Exception ignored) {
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        return null;
    }

    private List<List<Integer>> fetchGamesForContestFromFirestore(int contest) {
        List<List<Integer>> result = new ArrayList<>();
        HttpURLConnection conn = null;
        try {
            URL url = new URL(FIRESTORE_BASE + ":runQuery");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            String queryJson = "{\"structuredQuery\":{\"from\":[{\"collectionId\":\"games\"}],\"where\":{\"fieldFilter\":{\"field\":{\"fieldPath\":\"contestNumber\"},\"op\":\"EQUAL\",\"value\":{\"integerValue\":\"" + contest + "\"}}}}}";
            try (OutputStream os = conn.getOutputStream()) {
                os.write(queryJson.getBytes("UTF-8"));
            }

            if (conn.getResponseCode() != 200) return result;

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            JSONArray arr = new JSONArray(sb.toString());
            for (int i = 0; i < arr.length(); i++) {
                JSONObject item = arr.optJSONObject(i);
                if (item == null || !item.has("document")) continue;
                JSONObject fields = item.getJSONObject("document").optJSONObject("fields");
                if (fields == null || !fields.has("numbers")) continue;
                JSONObject numbersField = fields.optJSONObject("numbers");
                if (numbersField == null || !numbersField.has("arrayValue")) continue;
                JSONArray values = numbersField.getJSONObject("arrayValue").optJSONArray("values");
                if (values == null) continue;

                List<Integer> gameNums = new ArrayList<>();
                for (int j = 0; j < values.length(); j++) {
                    JSONObject v = values.optJSONObject(j);
                    if (v == null) continue;
                    if (v.has("integerValue")) {
                        gameNums.add(Integer.parseInt(v.getString("integerValue")));
                    } else if (v.has("doubleValue")) {
                        gameNums.add((int) v.getDouble("doubleValue"));
                    }
                }
                if (!gameNums.isEmpty()) {
                    result.add(gameNums);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Erro ao consultar jogos no Firestore: " + e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
        return result;
    }

    private void writeNotificationToFirestoreIfNeeded(int contest, String title, String message) {
        HttpURLConnection conn = null;
        try {
            // Usa um ID de documento determinístico (prize_contest_XXXX) para evitar duplicidade no Firestore
            URL url = new URL(FIRESTORE_BASE + "/notifications/prize_contest_" + contest);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PATCH");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
            String nowIso = isoFormat.format(new Date());

            JSONObject docObj = new JSONObject();
            JSONObject fields = new JSONObject();

            fields.put("userId", new JSONObject().put("stringValue", "all"));
            fields.put("title", new JSONObject().put("stringValue", title));
            fields.put("message", new JSONObject().put("stringValue", message));
            fields.put("type", new JSONObject().put("stringValue", "prize"));
            fields.put("read", new JSONObject().put("booleanValue", false));
            fields.put("createdAt", new JSONObject().put("timestampValue", nowIso));

            docObj.put("fields", fields);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(docObj.toString().getBytes("UTF-8"));
            }
            conn.getResponseCode();
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void showNativeCongratulationsNotification(Context context, String title, String body, int notifId) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Notificações",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notificações de sorteios, resultados e apostas premiadas do Bolão Amigos");
                channel.enableVibration(true);
                nm.createNotificationChannel(channel);
            }

            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent contentIntent = PendingIntent.getActivity(context, notifId, launchIntent, flags);

            int iconRes = context.getResources().getIdentifier("ic_launcher", "mipmap", context.getPackageName());
            if (iconRes == 0) {
                iconRes = android.R.drawable.ic_dialog_info;
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(iconRes)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_EVENT)
                    .setAutoCancel(true)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setContentIntent(contentIntent);

            nm.notify(notifId, builder.build());
        } catch (Exception e) {
            Log.w(TAG, "Erro ao exibir notificação nativa: " + e.getMessage());
        }
    }
}
