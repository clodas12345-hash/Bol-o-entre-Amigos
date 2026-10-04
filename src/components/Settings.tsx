import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth, isQuotaError } from '../lib/firebase';
import BetReleaseManager from './BetReleaseManager';
import TeimosinhaManager from './TeimosinhaManager';
import BackupManager from './BackupManager';
import HowToUseModal from './HowToUseModal';
import PoolSelector from './PoolSelector';
import { usePermissions } from '../lib/PermissionsContext';
import { usePool } from '../lib/PoolContext';
import { useToast } from './NotificationManager';
import {
  UserNotificationPreferences,
  getUserNotificationPreferences,
  saveUserNotificationPreferencesLocal,
  requestNotificationPermission,
  requestIgnoreBatteryOptimization,
  sendAppNotification,
  scheduleUpcomingDrawAlerts
} from '../lib/notifications';
import { formatDateBR } from '../lib/drawCalendar';

export default function Settings() {
  const { can, isAdmin, isCounselor } = usePermissions();
  const { activePool, setIsQuotaExceeded } = usePool();
  const { addToast } = useToast();
  const [showHowTo, setShowHowTo] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const isAdminOrCounselor = isAdmin || isCounselor;
  const isMegaSena = activePool?.lotteryType === 'megasena';

  const activeUid = useMemo(() => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    try {
      const phoneSaved = localStorage.getItem('bolao_phone_user');
      if (phoneSaved) {
        const parsed = JSON.parse(phoneSaved);
        return parsed?.sessionUser?.uid || null;
      }
    } catch {}
    return null;
  }, []);

  const [prefs, setPrefs] = useState<UserNotificationPreferences>(() =>
    getUserNotificationPreferences(activeUid)
  );

  // Carrega preferências salvas no perfil do participante (Firestore)
  useEffect(() => {
    if (!activeUid) return;
    const loadRemotePrefs = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', activeUid));
        if (userSnap.exists() && userSnap.data().notificationPreferences) {
          const remote = userSnap.data().notificationPreferences;
          const merged = saveUserNotificationPreferencesLocal(remote, activeUid);
          setPrefs(merged);
          return;
        }
        const memberSnap = await getDoc(doc(db, 'members', activeUid));
        if (memberSnap.exists() && memberSnap.data().notificationPreferences) {
          const remote = memberSnap.data().notificationPreferences;
          const merged = saveUserNotificationPreferencesLocal(remote, activeUid);
          setPrefs(merged);
        }
      } catch (err) {
        console.warn('Não foi possível sincronizar preferências de notificação do Firestore:', err);
        if (isQuotaError(err)) setIsQuotaExceeded(true);
      }
    };
    loadRemotePrefs();
  }, [activeUid]);

  const handleUpdatePreference = async (patch: Partial<UserNotificationPreferences>) => {
    const updated = saveUserNotificationPreferencesLocal(patch, activeUid);
    setPrefs(updated);
    setIsSavingPrefs(true);

    try {
      if (patch.pushEnabled === true) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await requestIgnoreBatteryOptimization();
        }
      }

      await scheduleUpcomingDrawAlerts(isMegaSena ? 'megasena' : 'lotofacil', activeUid);

      if (activeUid) {
        try {
          await updateDoc(doc(db, 'users', activeUid), {
            notificationPreferences: updated,
            alertPreferences: updated
          });
        } catch {
          try {
            await setDoc(doc(db, 'members', activeUid), {
              notificationPreferences: updated
            }, { merge: true });
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Erro ao salvar preferência:', err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleTestSelectedNotification = async () => {
    await requestNotificationPermission();
    await sendAppNotification('🔔 Notificação do Bolão Amigos', {
      body: `Suas preferências de notificação estão ativas hoje (${formatDateBR(new Date())})!`,
      category: 'test',
      uid: activeUid
    });
    addToast('Notificação de teste enviada com sucesso!', 'success');
  };

  const activeCategoriesCount = [
    prefs.chatDailyNotification,
    prefs.newContestNotification,
    prefs.drawTimeAlerts,
    prefs.officialResultsAlerts,
    prefs.winningPrizeAlerts,
    prefs.paymentAndSystemAlerts,
    ...(isAdminOrCounselor ? [prefs.missingGamesReminder] : [])
  ].filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
          <span>⚙️</span>
          <span>Configurações</span>
        </h1>
        {isSavingPrefs && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-pulse">
            ✓ Salvando preferências...
          </span>
        )}
      </div>

      {/* BOTÃO E PAINEL DE NOTIFICAÇÕES (Para todos os participantes escolherem o que desejam receber) */}
      <div className="bg-white rounded-2xl border border-indigo-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowNotifPanel(!showNotifPanel)}
          className="w-full p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 text-white flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-95 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🔔
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Notificações do Aplicativo
                </h2>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  prefs.pushEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-red-500/20 text-red-300 border-red-400/40'
                }`}>
                  {prefs.pushEnabled ? `🟢 Ativas (${activeCategoriesCount} selecionadas)` : '🔕 Desativadas'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100/90 mt-0.5 leading-snug">
                Toque aqui para escolher quais notificações você deseja receber no celular.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-amber-400 text-indigo-950 font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1">
              <span>🔔 Notificação</span>
              <span className={`text-[9px] transition-transform duration-200 ${showNotifPanel ? 'rotate-180' : ''}`}>▼</span>
            </span>
          </div>
        </button>

        {showNotifPanel && (
          <div className="p-4 sm:p-5 space-y-4 bg-white animate-in fade-in duration-150">
            {/* Chave Geral de Notificações */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xl">📲</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-indigo-950">
                    Receber Notificações neste Aparelho
                  </h3>
                  <p className="text-[11px] text-indigo-700/90">
                    Ative ou desative todos os alertas de uma só vez, ou escolha individualmente abaixo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleTestSelectedNotification}
                  className="bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  ✨ Testar Agora
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdatePreference({ pushEnabled: !prefs.pushEnabled })}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shadow-xs ${
                    prefs.pushEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {prefs.pushEnabled ? 'Ativado ✓' : 'Desativado'}
                </button>
              </div>
            </div>

            {/* Lista de Opções para o Participante Escolher */}
            <div className={`space-y-2.5 ${!prefs.pushEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 px-1">
                Escolha quais notificações você quer receber:
              </p>

              {/* 1. Notificação Diária do Chat (1 por dia) */}
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shrink-0 font-bold">
                    💬
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-gray-900">
                        Mensagens no Chat (1 vez por dia)
                      </span>
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Limite: 1/dia
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Sobe apenas 1 notificação por dia caso existam novas mensagens no chat do grupo, sem incomodar a cada conversa.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.chatDailyNotification}
                  onChange={(e) => handleUpdatePreference({ chatDailyNotification: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* 2. Apostas Premiadas e Rateio */}
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0 font-bold">
                    🏆
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Apostas Premiadas e Prêmios do Bolão
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Receba um aviso imediato sempre que alguma aposta do bolão for premiada na Caixa.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.winningPrizeAlerts}
                  onChange={(e) => handleUpdatePreference({ winningPrizeAlerts: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* 3. Resultado Oficial Publicado */}
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0 font-bold">
                    🎉
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Resultado Oficial da Caixa e Conferência (20h35)
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Avise quando as dezenas sorteadas do concurso do dia forem publicadas e conferidas.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.officialResultsAlerts}
                  onChange={(e) =>
                    handleUpdatePreference({
                      officialResultsAlerts: e.target.checked,
                      notifyAt2035: e.target.checked
                    })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* 4. Lembrete do Horário do Sorteio */}
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg shrink-0 font-bold">
                    ⏰
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Lembrete do Horário do Sorteio (19h30 e 20h00)
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Lembrete 30 minutos antes e na hora exata do sorteio oficial nos dias de jogo.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.drawTimeAlerts}
                  onChange={(e) =>
                    handleUpdatePreference({
                      drawTimeAlerts: e.target.checked,
                      notifyAt1930: e.target.checked,
                      notifyAt2000: e.target.checked
                    })
                  }
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* 5. Novo Concurso / Novas Apostas Cadastradas */}
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg shrink-0 font-bold">
                    🍀
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Novas Apostas e Novo Concurso Cadastrado
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Avise quando os novos bilhetes do concurso forem subidos no aplicativo.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.newContestNotification}
                  onChange={(e) => handleUpdatePreference({ newContestNotification: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* 6. Avisos Administrativos, Cotas e Pagamentos */}
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg shrink-0 font-bold">
                    📢
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Comunicados do Grupo, Cotas e Pagamentos
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      Avisos importantes enviados pela administração e confirmações de cota.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.paymentAndSystemAlerts}
                  onChange={(e) => handleUpdatePreference({ paymentAndSystemAlerts: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                />
              </label>

              {/* 7. Exclusivo para Admin / Conselheiro: Lembrete de Jogos Pendentes */}
              {isAdminOrCounselor && (
                <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition cursor-pointer">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center text-lg shrink-0 font-bold">
                      ⚠️
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-black text-amber-950 block">
                        Lembrete de Realizar Jogos Pendentes (A cada 2h)
                      </span>
                      <p className="text-[11px] text-amber-800/80 mt-0.5 leading-snug">
                        Exclusivo para Administradores e Conselheiros nos dias de sorteio sem jogo cadastrado.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.missingGamesReminder}
                    onChange={(e) => handleUpdatePreference({ missingGamesReminder: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Seção de Seleção do Bolão Principal */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">
            🎯
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-800">Bolão Principal / Ativo</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Selecione qual bolão deseja visualizar no aplicativo.</p>
          </div>
        </div>
        <div className="pt-1">
          <PoolSelector variant="light" />
        </div>
      </div>

      <button
        onClick={() => setShowHowTo(true)}
        className="w-full bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer shadow-2xs"
      >
        <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
          <span>📖</span>
          <span>Como usar o Bolão</span>
        </span>
        <span className="text-xs font-bold text-blue-600">Abrir Guia →</span>
      </button>

      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}

      {can('games_create') && <BetReleaseManager />}

      {can('system_backup_restore') && <BackupManager />}

      {can('games_create') && <TeimosinhaManager />}
    </div>
  );
}
