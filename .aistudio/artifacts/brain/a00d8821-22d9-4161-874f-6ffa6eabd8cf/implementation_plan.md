# Plano de Implementação: Sistema de Pix Programado

## 1. Estrutura de Dados (Firestore)
- Adicionar o campo `scheduledPix` à coleção `members` ou `users`.
  - Estrutura: `{ dueDate: 'YYYY-MM-DD', status: 'pending' | 'verified', notifiedDate: 'YYYY-MM-DD' }`

## 2. Interface (UI)
- **Administrador (PaymentModal/MembersList):** Adicionar input para selecionar a data do Pix programado e um switch "É Pix Programado?".
- **Membro (Notification Manager):** Ao receber a notificação, adicionar um botão "Confirmar Pix Realizado" que atualiza o status para 'verified'.

## 3. Lógica de Notificações
- **Cron/Tarefa Diária:** Criar uma função que roda diariamente, verifica membros com `scheduledPix` cuja data de agendamento foi ontem e o `notifiedDate` ainda não foi preenchido.
- **Disparo:**
  - Enviar Push Notification para o Membro: "Você confirmou o Pix agendado para ontem? Toque aqui para confirmar o envio."
  - Enviar Push Notification para o Admin: "Verificar extrato: O Pix programado de [Membro] caiu hoje?"

## 4. Confirmação
- Ambos os lados (Membro e Admin) terão interface para marcar como "Pix Recebido" ou "Pix Não Recebido".
