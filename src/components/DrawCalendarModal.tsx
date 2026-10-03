import { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Info,
  CalendarDays
} from 'lucide-react';
import { 
  isDrawDay, 
  isNationalHoliday, 
  getValidDrawSequence, 
  formatDateBR, 
  getDayNameBR,
  formatDateToYYYYMMDD
} from '../lib/drawCalendar';
import { usePool } from '../lib/PoolContext';

interface DrawCalendarModalProps {
  onClose: () => void;
}

export default function DrawCalendarModal({ onClose }: DrawCalendarModalProps) {
  const { activePool } = usePool();
  const lotteryType = (activePool?.lotteryType === 'megasena' ? 'megasena' : 'lotofacil') as 'lotofacil' | 'megasena';
  const isMegaSena = lotteryType === 'megasena';

  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedSimDate, setSelectedSimDate] = useState<string>(formatDateToYYYYMMDD(new Date()));
  const [simTeimosinhaCount, setSimTeimosinhaCount] = useState<number>(12);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Dias do mês atual
  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month]);

  // Sequência de Teimosinha para a data simulada
  const teimosinhaSequence = useMemo(() => {
    if (!selectedSimDate) return [];
    const parts = selectedSimDate.split('-');
    const startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return getValidDrawSequence(startDate, simTeimosinhaCount, lotteryType);
  }, [selectedSimDate, simTeimosinhaCount, lotteryType]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentMonthDate(new Date());
    setSelectedSimDate(formatDateToYYYYMMDD(new Date()));
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b ${isMegaSena ? 'bg-gradient-to-r from-emerald-700 to-teal-800' : 'bg-gradient-to-r from-purple-800 to-indigo-900'} text-white flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <CalendarIcon className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg tracking-tight">
                📅 Calendário de Sorteios & Feriados
              </h2>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                {isMegaSena ? 'Mega-Sena (Ter, Qui e Sáb)' : 'Lotofácil (Segunda a Sábado)'} • Feriados Nacionais Caixa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Navegação do Mês */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-200/80">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-200 rounded-xl transition text-gray-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <div className="text-center">
              <h3 className="font-black text-sm sm:text-base text-gray-800 uppercase tracking-wide">
                {monthNames[month]} {year}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-2.5 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-black rounded-lg transition"
              >
                Hoje
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-200 rounded-xl transition text-gray-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Dia de Sorteio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Feriado Nacional
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Domingo / Sem Sorteio
            </span>
          </div>

          {/* Grid de Dias do Mês */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
              <div key={d} className={`text-[11px] font-black uppercase tracking-wider py-1 ${i === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {d}
              </div>
            ))}

            {/* Espaçamento inicial do mês */}
            {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}

            {daysInMonth.map((dayDate) => {
              const dateStr = formatDateToYYYYMMDD(dayDate);
              const drawCheck = isDrawDay(dayDate, lotteryType);
              const holidayCheck = isNationalHoliday(dayDate);
              const isSelected = dateStr === selectedSimDate;
              const isToday = formatDateToYYYYMMDD(new Date()) === dateStr;

              let bgClass = 'bg-gray-100 text-gray-400';
              if (holidayCheck.isHoliday) {
                bgClass = 'bg-red-100 text-red-800 border border-red-300 font-bold';
              } else if (drawCheck.isDraw) {
                bgClass = 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold hover:bg-emerald-100';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedSimDate(dateStr)}
                  className={`p-2 rounded-xl text-xs transition flex flex-col items-center justify-center relative cursor-pointer ${bgClass} ${
                    isSelected ? 'ring-2 ring-purple-600 shadow-md scale-105 z-10' : ''
                  } ${isToday ? 'border-2 border-blue-500' : ''}`}
                  title={holidayCheck.name || drawCheck.reason || 'Dia do mês'}
                >
                  <span>{dayDate.getDate()}</span>
                  {holidayCheck.isHoliday && (
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-0.5"></span>
                  )}
                  {drawCheck.isDraw && !holidayCheck.isHoliday && (
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detalhes da Data Selecionada / Simulador de Teimosinha sem Feriados */}
          {selectedSimDate && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-4 rounded-2xl border border-indigo-150 space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-indigo-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span className="font-extrabold text-xs text-indigo-950">
                    Detalhamento de Data: {formatDateBR(new Date(selectedSimDate + 'T00:00:00'))} ({getDayNameBR(new Date(selectedSimDate + 'T00:00:00'))})
                  </span>
                </div>
                {isNationalHoliday(new Date(selectedSimDate + 'T00:00:00')).isHoliday ? (
                  <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200">
                    ❌ Feriado Nacional ({isNationalHoliday(new Date(selectedSimDate + 'T00:00:00')).name})
                  </span>
                ) : isDrawDay(new Date(selectedSimDate + 'T00:00:00'), lotteryType).isDraw ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    ✅ Dia Válido de Sorteio
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                    ⚠️ Sem Sorteio ({isDrawDay(new Date(selectedSimDate + 'T00:00:00'), lotteryType).reason})
                  </span>
                )}
              </div>

              {/* Simulador de Agendamento de Teimosinha Válida */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-gray-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Projeção de Teimosinha Sem Feriados:
                  </label>
                  <select
                    value={simTeimosinhaCount}
                    onChange={(e) => setSimTeimosinhaCount(Number(e.target.value))}
                    className="bg-white border border-gray-300 text-xs rounded-lg px-2 py-1 font-bold text-gray-800"
                  >
                    <option value={2}>2 Sorteios</option>
                    <option value={4}>4 Sorteios</option>
                    <option value={8}>8 Sorteios</option>
                    <option value={12}>12 Sorteios</option>
                    <option value={24}>24 Sorteios</option>
                  </select>
                </div>

                {/* Lista de Sorteios da Teimosinha com Pulo Automático de Feriados */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {teimosinhaSequence.map((item) => (
                    <div
                      key={item.contestIndex}
                      className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-indigo-700">#{item.contestIndex} Sorteio</span>
                        <span className="text-gray-400 font-medium">{item.dayName.split('-')[0]}</span>
                      </div>
                      <span className="font-black text-xs text-gray-800 mt-1">{item.dateFormatted}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Sorteios pulam domingos e feriados nacionais automaticamente.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
