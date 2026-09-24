import { useNavigate, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  backTo?: string; // Se omitido, usa navigate(-1) ou cai para '/'
}

export default function PageHeader({ title, subtitle, icon, backTo }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  // Se já estiver na página principal, não precisa do botão de voltar
  const isHome = location.pathname === '/';

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3 sm:p-4 mb-4 shadow-xs">
      <div className="flex items-center gap-3">
        {!isHome && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition shadow-2xs"
            title="Voltar à página anterior"
          >
            <span>←</span> Voltar
          </button>
        )}
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>

      {!isHome && (
        <button
          onClick={handleClose}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-lg text-xs font-semibold transition"
          title="Fechar e ir para o Início"
        >
          <span>✕</span> Fechar
        </button>
      )}
    </div>
  );
}
