import { Capacitor } from '@capacitor/core';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

// URL base do backend no Cloud Run para quando o app roda nativamente no APK
export const BACKEND_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  'https://ais-dev-huai57g7b5d2yat2qnjukg-473118395752.us-west2.run.app';

/**
 * Retorna a URL completa para chamadas de API, garantindo compatibilidade entre:
 * - APK Android / Capacitor (onde a origem é localhost e precisa apontar para o Cloud Run)
 * - Navegador Web em produção (onde /api pode ser relativo ou apontar para a mesma origem)
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (typeof window === 'undefined') {
    return `${BACKEND_BASE_URL}${cleanEndpoint}`;
  }

  const isNative = Capacitor.isNativePlatform();
  const isLocalOrigin = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'ionic:' ||
    window.location.protocol === 'file:';

  if (isNative || isLocalOrigin) {
    return `${BACKEND_BASE_URL}${cleanEndpoint}`;
  }

  return cleanEndpoint;
}

/**
 * Executa um fetch seguro com timeout e validação rigorosa de JSON,
 * evitando erros do tipo "Unexpected token '<', '<!DOCTYPE '... is not valid JSON"
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<{ success: boolean; data?: T; message?: string; status?: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    // Se a resposta começou com HTML (ex: <!DOCTYPE ou <html)
    if (text.trim().startsWith('<') || (!contentType.includes('application/json') && !contentType.includes('text/json'))) {
      console.warn(`[SafeFetch] Resposta inesperada (não-JSON) de ${url}:`, text.substring(0, 100));
      return {
        success: false,
        status: res.status,
        message: 'O servidor retornou uma resposta inválida. Tente novamente em instantes.'
      };
    }

    try {
      const json = JSON.parse(text);
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          data: json,
          message: json.message || `Erro HTTP ${res.status}`
        };
      }
      return {
        success: true,
        status: res.status,
        data: json
      };
    } catch (parseErr) {
      console.warn(`[SafeFetch] Erro de parse JSON em ${url}:`, parseErr);
      return {
        success: false,
        status: res.status,
        message: 'Não foi possível processar a resposta dos dados.'
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Tempo limite de conexão esgotado (timeout).' };
    }
    return { success: false, message: err.message || 'Falha de conexão com a rede.' };
  }
}

export interface LotteryResultData {
  contest: number;
  date: string;
  numbers: number[];
  accumulated: boolean;
  nextEstimatedPrize?: number;
  prize15Winners?: number;
  prize15Amount?: number;
  prize14Winners?: number;
  prize14Amount?: number;
  prize13Winners?: number;
  prize13Amount?: number;
  prize12Winners?: number;
  prize12Amount?: number;
  prize11Winners?: number;
  prize11Amount?: number;
  prize6Winners?: number;
  prize6Amount?: number;
  prize5Winners?: number;
  prize5Amount?: number;
  prize4Winners?: number;
  prize4Amount?: number;
  createdAt?: any;
  isManual?: boolean;
}

/**
 * Busca o resultado oficial da Loteria (Lotofácil ou Mega-Sena) diretamente de múltiplas fontes:
 * 1. Backend no Cloud Run (/api/lotofacil/results ou /api/megasena/results)
 * 2. API Pública BrasilAPI (https://brasilapi.com.br/api/loterias/v1/...)
 * 3. API Pública Heroku LoteriasCaixa
 * 4. API Pública Guidi Loterias
 * 5. API Oficial da Caixa Econômica Federal
 * 
 * Ao encontrar um sorteio oficial válido, salva automaticamente no Firestore para sincronizar todos os aparelhos.
 */
export async function fetchLotteryResultDirectly(
  type: 'lotofacil' | 'megasena',
  contestNumber?: number | string
): Promise<LotteryResultData | null> {
  const isMega = type === 'megasena';
  const expectedNumbersCount = isMega ? 6 : 15;
  const isLatest = !contestNumber || contestNumber === 'latest' || contestNumber === 0 || contestNumber === '0';
  const contestParam = isLatest ? '' : String(contestNumber);

  // 1. Tenta pelo Backend Cloud Run primeiro
  try {
    const backendUrl = getApiUrl(isMega ? '/api/megasena/results' : '/api/lotofacil/results');
    const backendRes = await safeFetchJson<{ success: boolean; result?: LotteryResultData }>(
      backendUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest: isLatest ? 'latest' : String(contestNumber) })
      },
      8000
    );

    if (backendRes.success && backendRes.data?.result) {
      const res = backendRes.data.result;
      if (Array.isArray(res.numbers) && res.numbers.length === expectedNumbersCount && Number(res.contest) > 0) {
        console.log(`[Lottery] Resultado ${type} #${res.contest} obtido via Backend`);
        await saveResultToFirestore(type, res);
        return res;
      }
    }
  } catch (err) {
    console.warn(`[Lottery] Backend falhou para ${type}, tentando fontes diretas:`, err);
  }

  // 2. Fontes Públicas Diretas de Contingência
  const publicEndpoints = isMega
    ? [
        `https://brasilapi.com.br/api/loterias/v1/megasena/${contestParam}`,
        `https://loteriascaixa-api.herokuapp.com/api/megasena/${isLatest ? 'latest' : contestParam}`,
        `https://api.guidi.dev.br/loteria/megasena/${isLatest ? 'ultimo' : contestParam}`,
        `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${contestParam}`
      ]
    : [
        `https://brasilapi.com.br/api/loterias/v1/lotofacil/${contestParam}`,
        `https://loteriascaixa-api.herokuapp.com/api/lotofacil/${isLatest ? 'latest' : contestParam}`,
        `https://api.guidi.dev.br/loteria/lotofacil/${isLatest ? 'ultimo' : contestParam}`,
        `https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil/${contestParam}`
      ];

  for (const url of publicEndpoints) {
    try {
      const apiRes = await safeFetchJson<any>(url, { method: 'GET' }, 7000);
      if (!apiRes.success || !apiRes.data) continue;

      const data = apiRes.data;
      const rawNumbers = data.dezenas || data.listaDezenas || data.resultado || data.numeros || data.numbers;

      if (Array.isArray(rawNumbers) && rawNumbers.length === expectedNumbersCount) {
        const numbers = rawNumbers.map((n: any) => Number(n)).sort((a: number, b: number) => a - b);
        const contestNum = Number(data.concurso || data.numero || data.contest || contestNumber);
        const drawDate = data.data || data.dataApuracao || data.data_concurso || data.date || new Date().toLocaleDateString('pt-BR');

        if (contestNum > 0) {
          const formatted: LotteryResultData = {
            contest: contestNum,
            date: drawDate,
            numbers,
            accumulated: !!(data.acumulado || data.acumulou),
            nextEstimatedPrize: Number(data.valorEstimadoProximoConcurso || data.valorEstimado || data.valorAcumuladoProximoConcurso) || 0,
            createdAt: new Date(),
            isManual: false
          };

          console.log(`[Lottery] Resultado oficial ${type} #${contestNum} obtido de: ${url}`);
          await saveResultToFirestore(type, formatted);
          return formatted;
        }
      }
    } catch (endpointErr) {
      console.warn(`[Lottery] Falha no endpoint ${url}:`, endpointErr);
    }
  }

  return null;
}

/**
 * Salva o resultado no Firestore se for oficial e válido
 */
async function saveResultToFirestore(type: 'lotofacil' | 'megasena', data: LotteryResultData): Promise<void> {
  try {
    const colName = type === 'megasena' ? 'megasena_results' : 'lotofacil_results';
    const contestDocId = String(data.contest);
    await setDoc(doc(db, colName, contestDocId), {
      ...data,
      updatedAt: new Date()
    }, { merge: true });
    
    // Atualiza cache local
    localStorage.setItem(`bolao_cache_${type}_latest_result`, JSON.stringify(data));
  } catch (err) {
    console.warn(`[Lottery] Não foi possível salvar resultado de ${type} no Firestore:`, err);
  }
}
