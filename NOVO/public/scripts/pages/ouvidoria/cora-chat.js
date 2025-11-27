/**
 * Página: Cora Chat
 * Interface de chat com assistente virtual
 * 
 * Baseado no sistema antigo, adaptado para o modelo novo
 */

let chatMessages = [];

/**
 * Carregar página de chat
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
    // Carregar mensagens do banco
    await loadChatMessages();
    
    // Renderizar mensagens
    renderMessages();
    
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

/**
 * Carregar mensagens do banco
 */
async function loadChatMessages() {
  try {
    if (window.Logger) {
      window.Logger.debug('📥 Carregando mensagens do banco...');
    }
    
    const response = await fetch('/api/chat/messages', {
      credentials: 'include' // Enviar cookies de sessão
    });
    if (response.ok) {
      const data = await response.json();
      const messages = Array.isArray(data) ? data : (data.messages || []);
      
      if (window.Logger) {
        window.Logger.debug(`✅ Mensagens recebidas: ${messages.length} mensagens`);
      }
      
      chatMessages = messages.map(msg => ({
        text: msg.text || msg.content || '',
        sender: msg.sender || (msg.role === 'user' ? 'user' : 'cora'),
        createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
      }));
      
      // Se não há mensagens, adicionar mensagem inicial
      if (chatMessages.length === 0) {
        chatMessages.push({
          text: 'Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ouvidoria. Como posso ajudar você hoje?',
          sender: 'cora',
          createdAt: new Date().toISOString()
        });
      }
    } else {
      if (window.Logger) {
        window.Logger.warn('⚠️ Erro ao carregar mensagens:', response.status);
      }
      // Mensagem inicial em caso de erro
      chatMessages = [{
        text: 'Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual. Como posso ajudar você hoje?',
        sender: 'cora',
        createdAt: new Date().toISOString()
      }];
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('❌ Erro ao carregar mensagens:', error);
    }
    // Mensagem inicial em caso de erro
    chatMessages = [{
      text: 'Olá! Sou a Cora, sua assistente virtual. Como posso ajudar você hoje?',
      sender: 'cora',
      createdAt: new Date().toISOString()
    }];
  }
}

/**
 * Formatar data/hora para exibição
 */
function formatChatTime(date) {
  if (!date) return 'Agora';
  
  const now = new Date();
  const msgDate = new Date(date);
  const diffMs = now - msgDate;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
  return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * Renderizar mensagens na tela
 */
function renderMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  
  if (!chatMessages || chatMessages.length === 0) {
    container.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhuma mensagem ainda</div>';
    return;
  }
  
  container.innerHTML = chatMessages.map(msg => {
    const isUser = msg.sender === 'user';
    return `
      <div class="flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4">
        ${!isUser ? `
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-bold">C</span>
          </div>
        ` : `
          <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs">Você</span>
          </div>
        `}
        <div class="flex-1 ${isUser ? 'text-right' : ''}">
          <div class="bg-slate-800/60 rounded-lg p-3 text-sm text-slate-200 inline-block ${isUser ? 'bg-cyan-500/20' : ''}">
            ${!isUser ? `<div class="font-semibold text-purple-300 mb-1">Cora</div>` : ''}
            <div class="whitespace-pre-wrap">${msg.text}</div>
          </div>
          <div class="text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'ml-1'}">${formatChatTime(msg.createdAt)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  // Scroll para o final
  container.scrollTop = container.scrollHeight;
}

/**
 * Enviar mensagem
 */
async function sendMessage(text) {
  if (window.Logger) {
    window.Logger.debug('🚀 sendMessage chamada', { text });
  }
  
  if (!text.trim()) {
    if (window.Logger) {
      window.Logger.warn('⚠️ Texto vazio, ignorando');
    }
    return;
  }
  
  const message = {
    text: text.trim(),
    sender: 'user',
    createdAt: new Date().toISOString()
  };
  
  if (window.Logger) {
    window.Logger.debug('💬 Adicionando mensagem do usuário', message);
  }
  
  // Adicionar mensagem do usuário
  chatMessages.push(message);
  renderMessages();
  
  // Limpar input
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  
  try {
    if (window.Logger) {
      window.Logger.debug('📡 Enviando para backend...', { text: text.trim() });
    }
    
    // Enviar para backend
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Enviar cookies de sessão
      body: JSON.stringify({ text: text.trim() })
    });
    
    if (window.Logger) {
      window.Logger.debug('📥 Status da resposta:', response.status, response.statusText);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      if (window.Logger) {
        window.Logger.error('❌ Erro na resposta do backend', response.status, errorText);
      }
      throw new Error(`Erro ao enviar mensagem: ${response.status}`);
    }
    
    const data = await response.json();
    if (window.Logger) {
      window.Logger.debug('✅ Resposta recebida do backend', { 
        hasMessage: !!data.message, 
        hasResponse: !!data.response,
        responsePreview: data.response?.substring(0, 100) + '...' || 'sem resposta'
      });
    }
    
    // Adicionar resposta da Cora
    const coraMessage = {
      text: data.response || 'Obrigada pela sua mensagem! Como posso ajudar?',
      sender: 'cora',
      createdAt: new Date().toISOString()
    };
    
    if (window.Logger) {
      window.Logger.debug('🤖 Adicionando resposta da Cora', coraMessage);
    }
    
    chatMessages.push(coraMessage);
    renderMessages();
    
    // Salvar resposta também
    if (window.Logger) {
      window.Logger.debug('💾 Salvando resposta da Cora no banco...');
    }
    
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Enviar cookies de sessão
        body: JSON.stringify({ text: coraMessage.text, sender: 'cora' })
      });
      if (window.Logger) {
        window.Logger.debug('✅ Resposta da Cora salva no banco');
      }
    } catch (e) {
      if (window.Logger) {
        window.Logger.warn('⚠️ Erro ao salvar resposta da Cora:', e);
      }
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('❌ Erro ao enviar mensagem:', error);
    }
    
    const errorMsg = {
      text: 'Desculpe, ocorreu um erro. Tente novamente.',
      sender: 'cora',
      createdAt: new Date().toISOString()
    };
    chatMessages.push(errorMsg);
    renderMessages();
  }
}

/**
 * Inicializar formulário da página
 */
function initChatPage() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const submitBtn = document.getElementById('chatSubmitBtn');
  
  if (!form || !input) {
    if (window.Logger) {
      window.Logger.error('❌ Elementos do formulário não encontrados');
    }
    return;
  }
  
  if (window.Logger) {
    window.Logger.debug('✅ Elementos encontrados', { form: !!form, input: !!input, submitBtn: !!submitBtn });
  }
  
  const sendPageMessage = (e) => {
    if (window.Logger) {
      window.Logger.debug('📤 Tentando enviar mensagem', input.value);
    }
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const text = input.value.trim();
    if (window.Logger) {
      window.Logger.debug('📝 Texto capturado:', text);
    }
    
    if (text) {
      if (window.Logger) {
        window.Logger.debug('✅ Chamando sendMessage...');
      }
      sendMessage(text);
    } else {
      if (window.Logger) {
        window.Logger.warn('⚠️ Texto vazio, não enviando');
      }
    }
    return false;
  };
  
  // Adicionar listeners
  form.onsubmit = sendPageMessage;
  
  if (submitBtn) {
    submitBtn.onclick = (e) => {
      if (window.Logger) {
        window.Logger.debug('🖱️ Botão Enviar clicado');
      }
      sendPageMessage(e);
    };
  }
  
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (window.Logger) {
        window.Logger.debug('⌨️ Enter pressionado');
      }
      e.preventDefault();
      e.stopPropagation();
      sendPageMessage(e);
    }
  };
  
  // Focar no input
  input.focus();
}

window.loadCoraChat = loadCoraChat;

