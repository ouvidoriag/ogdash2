/**
 * Página: Cora Chat
 * Interface de chat com assistente virtual
 * 
 * Recriada com estrutura otimizada
 */

async function loadCoraChat() {
  if (window.Logger) {
    window.Logger.debug('💬 loadCoraChat: Iniciando');
  }
  
  const page = document.getElementById('page-cora-chat');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Carregar mensagens
    await loadChatMessages();
    
    // Renderizar mensagens
    const chatMessages = window.chatMessages || [];
    renderChatMessages('chatMessages', chatMessages);
    
    // Inicializar formulário da página
    initChatPage();
    
    if (window.Logger) {
      window.Logger.success('💬 loadCoraChat: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar CoraChat:', error);
    }
  }
}

async function loadChatMessages() {
  try {
    const messages = await window.dataLoader?.load('/api/chat/messages', {
      useDataStore: true,
      ttl: 1 * 60 * 1000 // 1 minuto
    }) || [];
    
    window.chatMessages = messages;
    return messages;
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar mensagens:', error);
    }
    return [];
  }
}

function renderChatMessages(containerId, messages) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!messages || messages.length === 0) {
    container.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhuma mensagem ainda</div>';
    return;
  }
  
  container.innerHTML = messages.map(msg => {
    const isUser = msg.role === 'user';
    const time = formatChatTime(msg.timestamp || msg.createdAt);
    return `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'} mb-4">
        <div class="max-w-[80%] ${isUser ? 'bg-cyan-500/20' : 'bg-slate-800/60'} rounded-lg p-3">
          <div class="text-xs text-slate-400 mb-1">${isUser ? 'Você' : 'Cora'} • ${time}</div>
          <div class="text-sm text-slate-200">${msg.content || msg.text || ''}</div>
        </div>
      </div>
    `;
  }).join('');
  
  // Scroll para o final
  container.scrollTop = container.scrollHeight;
}

function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return window.dateUtils?.formatDate(date) || date.toLocaleString('pt-BR');
}

function initChatPage() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const submitBtn = document.getElementById('chatSubmitBtn');
  
  if (!form || !input) return;
  
  const sendMessage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = input.value.trim();
    if (!text) return;
    
    try {
      // Enviar mensagem
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      
      if (response.ok) {
        input.value = '';
        // Recarregar mensagens
        await loadChatMessages();
        const chatMessages = window.chatMessages || [];
        renderChatMessages('chatMessages', chatMessages);
      }
    } catch (error) {
      if (window.Logger) {
        window.Logger.error('Erro ao enviar mensagem:', error);
      }
    }
    
    return false;
  };
  
  form.onsubmit = sendMessage;
  if (submitBtn) {
    submitBtn.onclick = sendMessage;
  }
  
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };
}

window.loadCoraChat = loadCoraChat;

