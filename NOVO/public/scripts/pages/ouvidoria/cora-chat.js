/**
 * Página: Cora Chat - UNIFICADO
 * Interface de chat com assistente virtual
 * 
 * Sistema unificado que funciona em qualquer contexto (Ouvidoria, Zeladoria, etc.)
 * Detecta automaticamente o contexto baseado na página ativa
 */

let chatMessages = [];
let currentContext = 'ouvidoria'; // Contexto padrão
let chatConfig = null; // Configuração dinâmica do chat

/**
 * Detectar contexto e configuração do chat baseado na página ativa
 */
function detectChatConfig() {
  // Tentar encontrar qualquer página de chat visível
  const possiblePages = [
    'page-cora-chat',
    'page-zeladoria-cora-chat',
    'page-central-cora'
  ];
  
  let activePage = null;
  let pageId = null;
  
  for (const pageIdCandidate of possiblePages) {
    const page = document.getElementById(pageIdCandidate);
    if (page && page.style.display !== 'none') {
      activePage = page;
      pageId = pageIdCandidate;
      break;
    }
  }
  
  if (!activePage) {
    // Fallback: tentar encontrar qualquer elemento de chat
    const anyChatForm = document.querySelector('form[id*="chat"], form[id*="Chat"]');
    if (anyChatForm) {
      activePage = anyChatForm.closest('section');
      if (activePage) {
        pageId = activePage.id;
      }
    }
  }
  
  // Detectar contexto baseado no ID da página ou seção
  if (pageId) {
    if (pageId.includes('zeladoria')) {
      currentContext = 'zeladoria';
    } else if (pageId.includes('central')) {
      currentContext = 'central';
    } else {
      currentContext = 'ouvidoria';
    }
  }
  
  // Tentar encontrar elementos do chat (múltiplos padrões de ID)
  const form = document.getElementById('chatForm') || 
              document.getElementById('zeladoria-cora-chat-form') ||
              document.querySelector('form[id*="chat"]');
  
  const input = document.getElementById('chatInput') || 
                document.getElementById('zeladoria-cora-chat-input') ||
                form?.querySelector('input[type="text"]');
  
  const submitBtn = document.getElementById('chatSubmitBtn') || 
                    document.getElementById('zeladoria-cora-chat-submit-btn') ||
                    form?.querySelector('button[type="button"]');
  
  const messagesContainer = document.getElementById('chatMessages') || 
                            document.getElementById('zeladoria-cora-chat-messages') ||
                            activePage?.querySelector('[id*="messages"]');
  
  return {
    page: activePage,
    pageId: pageId,
    context: currentContext,
    form: form,
    input: input,
    submitBtn: submitBtn,
    messagesContainer: messagesContainer
  };
}

/**
 * Carregar página de chat (unificado para todos os contextos)
 */
async function loadCoraChat() {
  if (window.Logger) {
    window.Logger.debug('💬 loadCoraChat: Iniciando (sistema unificado)');
  }
  
  // Detectar configuração do chat
  chatConfig = detectChatConfig();
  
  if (!chatConfig.page || !chatConfig.form || !chatConfig.input) {
    if (window.Logger) {
      window.Logger.warn('⚠️ Elementos do chat não encontrados. Tentando novamente...');
    }
    // Aguardar um pouco e tentar novamente (pode estar carregando)
    setTimeout(() => {
      chatConfig = detectChatConfig();
      if (chatConfig.form && chatConfig.input) {
        initChat();
      }
    }, 500);
    return Promise.resolve();
  }
  
  try {
    // Carregar mensagens do banco
    await loadChatMessages();
    
    // Renderizar mensagens
    renderMessages();
    
    // Inicializar formulário da página
    initChat();
    
    if (window.Logger) {
      window.Logger.success(`💬 loadCoraChat: Concluído (contexto: ${chatConfig.context})`);
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
      
      // Se não há mensagens, adicionar mensagem inicial baseada no contexto
      if (chatMessages.length === 0) {
        const contextMessages = {
          ouvidoria: 'Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ouvidoria. Como posso ajudar você hoje?',
          zeladoria: 'Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de zeladoria. Como posso ajudar você hoje?',
          central: 'Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual. Posso ajudar com análises de Ouvidoria, Zeladoria e e-SIC. Como posso ajudar você hoje?'
        };
        
        chatMessages.push({
          text: contextMessages[chatConfig?.context || 'ouvidoria'] || contextMessages.ouvidoria,
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
  if (!chatConfig || !chatConfig.messagesContainer) {
    // Tentar detectar novamente
    chatConfig = detectChatConfig();
    if (!chatConfig || !chatConfig.messagesContainer) {
      if (window.Logger) {
        window.Logger.warn('⚠️ Container de mensagens não encontrado');
      }
      return;
    }
  }
  
  const container = chatConfig.messagesContainer;
  
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
    window.Logger.debug('🚀 sendMessage chamada', { text, context: chatConfig?.context });
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
  if (chatConfig && chatConfig.input) {
    chatConfig.input.value = '';
    chatConfig.input.focus();
  }
  
  try {
    if (window.Logger) {
      window.Logger.debug('📡 Enviando para backend...', { text: text.trim(), context: chatConfig?.context });
    }
    
    // Enviar para backend com contexto
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Enviar cookies de sessão
      body: JSON.stringify({ 
        text: text.trim(),
        context: chatConfig?.context || 'ouvidoria'
      })
    });
    
    if (window.Logger) {
      window.Logger.debug('📥 Status da resposta:', response.status, response.statusText);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      if (window.Logger) {
        window.Logger.error('❌ Erro na resposta do backend', response.status, errorText);
      }
      
      // Tratamento especial para erro 401 (não autenticado)
      if (response.status === 401) {
        const errorMsg = {
          text: 'Sua sessão expirou. Por favor, faça login novamente.',
          sender: 'cora',
          createdAt: new Date().toISOString()
        };
        chatMessages.push(errorMsg);
        renderMessages();
        return; // Não fazer throw para evitar qualquer comportamento inesperado
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
 * Inicializar chat (unificado)
 */
function initChat() {
  // Re-detectar configuração se necessário
  if (!chatConfig || !chatConfig.form || !chatConfig.input) {
    chatConfig = detectChatConfig();
  }
  
  const { form, input, submitBtn } = chatConfig || {};
  
  if (!form || !input) {
    if (window.Logger) {
      window.Logger.error('❌ Elementos do formulário não encontrados');
    }
    return;
  }
  
  if (window.Logger) {
    window.Logger.debug('✅ Elementos encontrados', { form: !!form, input: !!input, submitBtn: !!submitBtn, context: chatConfig?.context });
  }
  
  // Garantir que o formulário não tenha action ou method que possam causar submit
  if (form) {
    form.setAttribute('action', 'javascript:void(0);');
    form.setAttribute('method', 'get');
    form.setAttribute('novalidate', 'novalidate');
    if (!form.hasAttribute('onsubmit')) {
      form.setAttribute('onsubmit', 'return false;');
    }
  }
  
  // Garantir que o botão não seja do tipo submit
  if (submitBtn && submitBtn.type !== 'button') {
    submitBtn.type = 'button';
  }
  
  const sendPageMessage = (e) => {
    if (window.Logger) {
      window.Logger.debug('📤 Tentando enviar mensagem', input.value);
    }
    
    // SEMPRE prevenir comportamento padrão
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
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
  
  // Remover listeners antigos se existirem (evitar duplicação)
  const oldSubmitHandler = form._submitHandler;
  const oldClickHandler = submitBtn?._clickHandler;
  const oldKeydownHandler = input._keydownHandler;
  
  if (oldSubmitHandler) {
    form.removeEventListener('submit', oldSubmitHandler);
  }
  if (oldClickHandler && submitBtn) {
    submitBtn.removeEventListener('click', oldClickHandler);
  }
  if (oldKeydownHandler) {
    input.removeEventListener('keydown', oldKeydownHandler);
  }
  
  // Criar novos handlers e armazenar referências
  const submitHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    sendPageMessage(e);
    return false;
  };
  
  const clickHandler = (e) => {
    if (window.Logger) {
      window.Logger.debug('🖱️ Botão Enviar clicado');
    }
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    sendPageMessage(e);
    return false;
  };
  
  const keydownHandler = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (window.Logger) {
        window.Logger.debug('⌨️ Enter pressionado');
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      sendPageMessage(e);
      return false;
    }
  };
  
  // Armazenar referências para possível remoção futura
  form._submitHandler = submitHandler;
  if (submitBtn) {
    submitBtn._clickHandler = clickHandler;
  }
  input._keydownHandler = keydownHandler;
  
  // Adicionar listeners usando addEventListener (mais confiável)
  form.addEventListener('submit', submitHandler, { capture: true, passive: false });
  
  if (submitBtn) {
    submitBtn.addEventListener('click', clickHandler, { capture: true });
  }
  
  input.addEventListener('keydown', keydownHandler, { capture: true });
  
  // Focar no input
  input.focus();
}

// Exportar função globalmente
window.loadCoraChat = loadCoraChat;

// Também exportar como loadZeladoriaCoraChat para compatibilidade
window.loadZeladoriaCoraChat = loadCoraChat;
