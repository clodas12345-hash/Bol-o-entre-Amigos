import React, { useState, useEffect, useMemo } from 'react';
import {
  buildPaymentThankYouMessage,
  buildWhatsAppUrl,
  formatFirstAndLastName,
  formatPhoneDisplay,
  getMonthNameYearBR,
  getPaymentThankYouRetroactiveData
} from '../lib/formatters';
import { useToast } from './NotificationManager';

export interface PaymentThankYouPayload {
  member: any;
  confirmedMonth: string;
  quotas?: number;
  amount?: number;
}

interface PaymentThankYouWhatsAppModalProps {
  data: PaymentThankYouPayload | null;
  payments: any[];
  onClose: () => void;
}

export default function PaymentThankYouWhatsAppModal({
  data,
  payments,
  onClose
}: PaymentThankYouWhatsAppModalProps) {
  const { addToast } = useToast();

  const retroData = useMemo(() => {
    if (!data) return null;
    return getPaymentThankYouRetroactiveData(data.member, payments, data.confirmedMonth);
  }, [data, payments]);

  const [selectedRetroMonths, setSelectedRetroMonths] = useState<string[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);

  const memberName = useMemo(() => {
    if (!data?.member) return 'Participante';
    return formatFirstAndLastName(
      data.member.displayName || data.member.name || data.member.memberName || data.member.email,
      'Participante'
    );
  }, [data]);

  const quotas = useMemo(() => {
    const q = Number(data?.quotas ?? data?.member?.quotas);
    return q > 0 ? q : 1;
  }, [data]);

  const amount = useMemo(() => {
    const a = Number(data?.amount);
    return a > 0 ? a : quotas * 20.0;
  }, [data, quotas]);

  useEffect(() => {
    if (!data || !retroData) return;
    setSelectedRetroMonths(retroData.preselectedRetroactiveMonths.slice(0, 3));
    setIsCustomEdited(false);
  }, [data, retroData]);

  useEffect(() => {
    if (!data || !retroData || isCustomEdited) return;
    const generated = buildPaymentThankYouMessage({
      memberName,
      confirmedMonth: retroData.confirmedMonth,
      quotas,
      amount,
      retroactiveMonths: selectedRetroMonths.slice(0, 3)
    });
    setMessageText(generated);
  }, [data, retroData, memberName, quotas, amount, selectedRetroMonths, isCustomEdited]);

  if (!data || !retroData) return null;

  const phone = data.member?.phone || '';
  const whatsappUrl = buildWhatsAppUrl(phone, messageText);

  const toggleRetroMonth = (monthStr: string) => {
    setIsCustomEdited(false);
    setSelectedRetroMonths(prev => {
      if (prev.includes(monthStr)) {
        return prev.filter(m => m !== monthStr);
      }
      if (prev.length >= 3) {
        return [...prev.slice(0, 2), monthStr];
      }
      return [...prev, monthStr];
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      addToast('Mensagem copiada!', 'success');
    } catch {
      addToast('Não foi possível copiar automaticamente.', 'warning');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              💬
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base truncate">
                Confirmar via WhatsApp
              </h3>
              <p className="text-xs text-emerald-100 font-semibold truncate">
                {memberName} {phone ? `• ${formatPhoneDisplay(phone)}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white font-bold text-base p-1 cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-emerald-800">Mês Vigente Quitado:</span>
              <span className="font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[11px]">
                ✓ {getMonthNameYearBR(retroData.confirmedMonth)} ({retroData.confirmedMonth})
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-900">
              <span>Cotas / Valor:</span>
              <span className="font-bold">
                {quotas} {quotas > 1 ? 'cotas' : 'cota'} • R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Meses retroativos (máximo 3) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
                Meses Retroativos (máx. 3)
              </span>
              <span className="text-[10px] font-bold text-gray-500">
                {selectedRetroMonths.length}/3 exibidos
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {retroData.availableRetroactiveMonths.slice(0, 3).map(mStr => {
                const isSelected = selectedRetroMonths.includes(mStr);
                return (
                  <button
                    key={mStr}
                    type="button"
                    onClick={() => toggleRetroMonth(mStr)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{mStr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prévia / Edição da Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
                Mensagem de Agradecimento
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                📋 Copiar texto
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => {
                setIsCustomEdited(true);
                setMessageText(e.target.value);
              }}
              rows={8}
              className="w-full border border-gray-300 rounded-2xl p-3 text-xs text-gray-800 bg-gray-50 focus:bg-white focus:outline-emerald-600 leading-relaxed font-medium"
            />
          </div>

          {!phone && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-semibold">
              ⚠️ Este participante não possui telefone cadastrado. Ao clicar em Enviar Agora, o WhatsApp abrirá para você escolher o contato.
            </p>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-[1.5] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>📲</span>
            <span>Enviar Agora</span>
          </a>
        </div>
      </div>
    </div>
  );
}
