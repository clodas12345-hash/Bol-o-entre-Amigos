# 🎰 Bolão Amigos

Aplicativo completo para gestão profissional de grupos de apostas (bolões), conferência automática de bilhetes via Inteligência Artificial, controle financeiro, pagamentos e comunicação entre participantes.

---

## 🚀 Funcionalidades Principais

- **📸 Leitura Inteligente de Bilhetes (OCR com IA)**:
  - Reconhecimento automático de dezenas e concursos da Lotofácil e Mega-Sena.
  - Pré-processamento nativo de imagem em Canvas (resolução otimizada em 1280px, conversão para escala de cinza e realce de contraste de 20%).
  - Suporte completo a fotos de bilhetes físicos e capturas de tela do aplicativo oficial Loterias Caixa.
  - Esteira resiliente de IA (modelo primário ultrarrápido com cota generosa e chaveamento automático para backup).
  - Timeout estrito de 30 segundos com prevenção contra travamentos em redes móveis oscilantes.

- **📊 Gestão de Apostas e Resultados**:
  - Cadastro de jogos simples e com Teimosinha.
  - Verificação de duplicidades no banco de dados para evitar jogos repetidos.
  - Conferência automática com os resultados oficiais das Loterias Caixa.

- **💰 Painel Financeiro e Rateio de Prêmios**:
  - Divisão proporcional e automática de prêmios por cotas.
  - Exportação e formatação do resumo do rateio para compartilhamento direto no WhatsApp.
  - Controle de pagamentos (PIX), saldo em caixa e histórico detalhado.

- **👥 Gestão de Membros e Permissões**:
  - Perfis de participantes e administradores.
  - Liberação de apostas por rodada/concurso e acompanhamento de cotas pagas.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
- **Backend**: Node.js, Express, Google GenAI SDK (Gemini).
- **Banco de Dados & Autenticação**: Firebase Firestore & Firebase Authentication.
- **Plataformas**: Web (PWA) e Android (APK via Capacitor/TWA).
