import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type ErrorCategory = 'API' | 'Camera' | 'Database' | 'System';

export interface SystemErrorLog {
  id: string;
  category: ErrorCategory;
  rawMessage: string;
  translatedMessage: string;
  context?: string;
  timestamp: Date;
  timestampFormatted: string;
}

const STORAGE_KEY = 'bolao_system_errors_cache';

/**
 * Mapeamento e tradução de mensagens de erro comuns em inglês para Português
 */
export function translateErrorMessage(category: ErrorCategory, rawError: any): string {
  const errorStr = String(
    rawError?.message || rawError?.error || rawError?.body || rawError || ''
  ).trim();

  const lower = errorStr.toLowerCase();

  // Erros de Banco de Dados / Firestore / Cotas
  if (category === 'Database' || lower.includes('quota') || lower.includes('resource-exhausted')) {
    if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
      return 'Cota limite do banco de dados temporariamente atingida. O sistema funcionará com os dados salvos em cache local.';
    }
    if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
      return 'Acesso negado: Seu usuário não possui permissão para alterar este registro no banco de dados.';
    }
    if (lower.includes('unavailable') || lower.includes('failed to get document')) {
      return 'Banco de dados inacessível ou em manutenção temporária. Tente novamente em instantes.';
    }
    if (lower.includes('not-found')) {
      return 'Registro não encontrado no banco de dados.';
    }
  }

  // Erros de Câmera e Dispositivo / Upload
  if (category === 'Camera' || lower.includes('notallowederror') || lower.includes('camera')) {
    if (lower.includes('notallowederror') || lower.includes('permission denied')) {
      return 'Permissão de acesso à câmera foi negada. Conceda permissão nas configurações do seu navegador ou celular.';
    }
    if (lower.includes('notfounderror') || lower.includes('devices not found')) {
      return 'Nenhuma câmera foi encontrada ou conectada no dispositivo.';
    }
    if (lower.includes('notreadableerror') || lower.includes('in use')) {
      return 'A câmera está sendo utilizada por outro aplicativo ou processo.';
    }
    if (lower.includes('overconstrainederror')) {
      return 'A resolução da câmera do dispositivo não é suportada.';
    }
    if (lower.includes('compression') || lower.includes('image')) {
      return 'Falha ao processar ou comprimir a imagem do bilhete.';
    }
  }

  // Erros de API (Caixa, Gemini OCR, HTTP)
  if (category === 'API' || lower.includes('fetch') || lower.includes('http')) {
    if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
      return 'Falha na conexão de rede com o servidor ou API da Caixa. Verifique sua conexão com a internet.';
    }
    if (lower.includes('timeout') || lower.includes('aborted') || lower.includes('signal is aborted')) {
      return 'Tempo limite de resposta excedido ao consultar a API oficial da Caixa/Gemini.';
    }
    if (lower.includes('ocr') || lower.includes('gemini')) {
      return 'A inteligência artificial não conseguiu interpretar os números do bilhete. Verifique o enquadramento ou iluminação.';
    }
    if (lower.includes('500') || lower.includes('internal server')) {
      return 'Erro interno no servidor da API. O serviço pode estar temporariamente fora do ar.';
    }
    if (lower.includes('404') || lower.includes('not found')) {
      return 'Sorteio ou concurso não foi localizado nos servidores oficiais da Caixa.';
    }
    if (lower.includes('403') || lower.includes('forbidden')) {
      return 'Acesso à API bloqueado pelo servidor remoto.';
    }
  }

  // Erros de Autenticação / Firebase Auth
  if (lower.includes('auth/user-not-found') || lower.includes('auth/wrong-password')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('auth/email-already-in-use')) {
    return 'Este e-mail já está cadastrado no sistema.';
  }
  if (lower.includes('auth/weak-password')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (lower.includes('auth/network-request-failed')) {
    return 'Erro de conexão durante a autenticação.';
  }

  // Se não houver padrão específico, formata a mensagem mantendo contexto amigável
  if (!errorStr || errorStr === '[object Object]') {
    return 'Ocorreu um erro inesperado no processamento da solicitação.';
  }

  return `Ocorreu uma falha na operação: ${errorStr}`;
}

/**
 * Lê erros armazenados localmente em cache
 */
export function getLocalErrorLogs(): SystemErrorLog[] {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch {
    return [];
  }
}

/**
 * Salva a lista de erros localmente
 */
function saveLocalErrorLogs(logs: SystemErrorLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.warn('Não foi possível salvar logs no localStorage:', e);
  }
}

/**
 * Registra um novo erro do sistema no banco de dados e no cache local
 */
export async function logSystemError(
  category: ErrorCategory,
  rawError: any,
  context?: string
): Promise<SystemErrorLog> {
  const rawMessage = String(
    rawError?.message || rawError?.error || rawError || 'Erro Desconhecido'
  );
  const translatedMessage = translateErrorMessage(category, rawError);
  const now = new Date();

  const newLog: SystemErrorLog = {
    id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category,
    rawMessage,
    translatedMessage,
    context: context || 'Geral',
    timestamp: now,
    timestampFormatted: now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  // 1. Atualiza cache local imediatamente em ordem cronológica inversa (mais recente no topo)
  const currentLogs = getLocalErrorLogs();
  const updatedLogs = [newLog, ...currentLogs];
  saveLocalErrorLogs(updatedLogs);

  // 2. Grava no Firestore se disponível
  try {
    await addDoc(collection(db, 'system_errors'), {
      category,
      rawMessage,
      translatedMessage,
      context: context || 'Geral',
      timestamp: serverTimestamp(),
      timestampFormatted: newLog.timestampFormatted
    });
  } catch (err) {
    console.warn('Não foi possível salvar o erro no Firestore (usando apenas cache local):', err);
  }

  return newLog;
}

/**
 * Inscreve um ouvinte para receber logs de erro em tempo real do Firestore / LocalStorage
 * Garantindo sempre ORDEM CRONOLÓGICA INVERSA (mais recente no topo)
 */
export function subscribeSystemErrors(
  onUpdate: (logs: SystemErrorLog[]) => void
) {
  // Retorna do cache local de imediato
  const initialLocal = getLocalErrorLogs();
  onUpdate(initialLocal);

  try {
    const q = query(
      collection(db, 'system_errors'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;

      const remoteLogs: SystemErrorLog[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let dateObj = new Date();
        if (data.timestamp?.toDate) {
          dateObj = data.timestamp.toDate();
        } else if (data.timestamp) {
          dateObj = new Date(data.timestamp);
        }

        return {
          id: docSnap.id,
          category: data.category || 'System',
          rawMessage: data.rawMessage || '',
          translatedMessage: data.translatedMessage || 'Erro registrado no sistema.',
          context: data.context || '',
          timestamp: dateObj,
          timestampFormatted: data.timestampFormatted || dateObj.toLocaleString('pt-BR')
        };
      });

      // Ordenação rigorosa em ordem cronológica inversa (os mais recentes primeiro)
      remoteLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      saveLocalErrorLogs(remoteLogs);
      onUpdate(remoteLogs);
    }, (err) => {
      console.warn('Erro ao escutar coleção system_errors no Firestore:', err);
    });

    return unsub;
  } catch (e) {
    console.warn('Falha ao registrar ouvinte system_errors:', e);
    return () => {};
  }
}

/**
 * Limpa todos os logs de erro acumulados
 */
export async function clearSystemErrors(): Promise<void> {
  saveLocalErrorLogs([]);
  try {
    const snap = await getDocs(query(collection(db, 'system_errors'), limit(50)));
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'system_errors', d.id)));
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn('Erro ao limpar coleção system_errors do Firestore:', e);
  }
}
