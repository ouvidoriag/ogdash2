/**
 * Página: Verificação de Notificações de Email
 * 
 * Exibe:
 * - Lista de emails enviados
 * - Filtros por tipo, secretaria, status, data
 * - Estatísticas gerais
 * - Última execução do cron
 */

async function loadNotificacoes() {
  const page = document.getElementById('page-notificacoes');
  if (!page || page.style.display === 'none') return;

  try {
    window.Logger?.info('Carregando página de notificações...');

    // Carregar dados em paralelo
    const [notificacoesData, statsData, ultimaExecucaoData] = await Promise.all([
      window.dataLoader?.load('/api/notificacoes?limit=50', {
        useDataStore: true,
        ttl: 60 * 1000 // 1 minuto
      }),
      window.dataLoader?.load('/api/notificacoes/stats', {
        useDataStore: true,
        ttl: 5 * 60 * 1000 // 5 minutos
      }),
      window.dataLoader?.load('/api/notificacoes/ultima-execucao', {
        useDataStore: true,
        ttl: 60 * 1000 // 1 minuto
      })
    ]);

    // Renderizar estatísticas
    renderStats(statsData, ultimaExecucaoData);

    // Renderizar tabela de notificações
    renderNotificacoes(notificacoesData);

    // Configurar filtros
    setupNotificacoesFilters();

    // Configurar controle manual (com pequeno delay para garantir que o DOM está pronto)
    setTimeout(() => {
      setupControleManual();
    }, 100);

    window.Logger?.info('Página de notificações carregada');

  } catch (error) {
    window.Logger?.error('Erro ao carregar notificações:', error);
    showError('Erro ao carregar dados de notificações');
  }
}

function renderStats(stats, ultimaExecucao) {
  // Cards de estatísticas
  const cardTotal = document.getElementById('notificacoes-total');
  const cardHoje = document.getElementById('notificacoes-hoje');
  const cardErros = document.getElementById('notificacoes-erros');
  const cardUltimaExec = document.getElementById('notificacoes-ultima-exec');

  if (cardTotal && stats) {
    cardTotal.textContent = stats.total?.toLocaleString('pt-BR') || '0';
  }

  if (cardHoje && stats) {
    cardHoje.textContent = stats.hoje?.toLocaleString('pt-BR') || '0';
  }

  if (cardErros && stats) {
    const erros = stats.porStatus?.find(s => s.status === 'erro')?.total || 0;
    cardErros.textContent = erros.toLocaleString('pt-BR');
    cardErros.parentElement.classList.toggle('text-red-400', erros > 0);
  }

  if (cardUltimaExec && ultimaExecucao?.ultimaExecucao) {
    const data = new Date(ultimaExecucao.ultimaExecucao.data);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);

    let texto = '';
    if (diffMin < 60) {
      texto = `Há ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
    } else if (diffHoras < 24) {
      texto = `Há ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
    } else {
      texto = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    cardUltimaExec.textContent = texto;
  }

  // Gráfico por tipo
  if (stats?.porTipo && window.chartFactory) {
    const tipos = stats.porTipo.map(t => {
      const labels = {
        '15_dias': '15 Dias Antes',
        'vencimento': 'Vencimento Hoje',
        '60_dias_vencido': '60 Dias Vencido'
      };
      return labels[t.tipo] || t.tipo;
    });
    const valores = stats.porTipo.map(t => t.total);

    window.chartFactory.createDoughnutChart('notificacoes-chart-tipo', tipos, valores, {
      colorIndex: 0,
      onClick: false,
    });
  }

  // Resumo de hoje
  if (ultimaExecucao?.hoje) {
    const resumoHoje = document.getElementById('notificacoes-resumo-hoje');
    if (resumoHoje) {
      const hoje = ultimaExecucao.hoje;
      let html = `
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-400">Enviados hoje:</span>
            <span class="font-semibold text-green-400">${hoje.totalEnviados || 0}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Erros hoje:</span>
            <span class="font-semibold ${hoje.totalErros > 0 ? 'text-red-400' : 'text-slate-400'}">${hoje.totalErros || 0}</span>
          </div>
      `;

      if (hoje.porSecretaria && hoje.porSecretaria.length > 0) {
        html += '<div class="mt-3 pt-3 border-t border-slate-700"><div class="text-xs text-slate-400 mb-2">Por Secretaria:</div>';
        hoje.porSecretaria.slice(0, 5).forEach(s => {
          html += `<div class="flex justify-between text-xs">
            <span class="text-slate-500">${s.secretaria}</span>
            <span class="text-slate-300">${s.total}</span>
          </div>`;
        });
        if (hoje.porSecretaria.length > 5) {
          html += `<div class="text-xs text-slate-500 mt-1">+${hoje.porSecretaria.length - 5} mais</div>`;
        }
        html += '</div>';
      }

      html += '</div>';
      resumoHoje.innerHTML = html;
    }
  }
}

function renderNotificacoes(data) {
  const tbody = document.getElementById('notificacoes-table-body');
  if (!tbody) return;

  if (!data?.notificacoes || data.notificacoes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-slate-500">
          Nenhuma notificação encontrada
        </td>
      </tr>
    `;
    return;
  }

  const labelsTipo = {
    '15_dias': '15 Dias Antes',
    'vencimento': 'Vencimento Hoje',
    '60_dias_vencido': '60 Dias Vencido'
  };

  const labelsStatus = {
    'enviado': { text: 'Enviado', class: 'bg-green-500/20 text-green-400' },
    'erro': { text: 'Erro', class: 'bg-red-500/20 text-red-400' },
    'pendente': { text: 'Pendente', class: 'bg-yellow-500/20 text-yellow-400' }
  };

  tbody.innerHTML = data.notificacoes.map(n => {
    const dataEnvio = new Date(n.enviadoEm);
    const dataEnvioFormatada = dataEnvio.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const tipoLabel = labelsTipo[n.tipoNotificacao] || n.tipoNotificacao;
    const statusInfo = labelsStatus[n.status] || { text: n.status, class: 'bg-slate-500/20 text-slate-400' };

    return `
      <tr class="hover:bg-slate-800/50 transition-colors">
        <td class="px-4 py-3 text-sm font-mono text-slate-300">${n.protocolo || 'N/A'}</td>
        <td class="px-4 py-3 text-sm text-slate-300">${n.secretaria || 'N/A'}</td>
        <td class="px-4 py-3 text-sm text-slate-300">${n.emailSecretaria || 'N/A'}</td>
        <td class="px-4 py-3 text-sm">
          <span class="px-2 py-1 rounded text-xs ${statusInfo.class}">${statusInfo.text}</span>
        </td>
        <td class="px-4 py-3 text-sm text-slate-400">${tipoLabel}</td>
        <td class="px-4 py-3 text-sm text-slate-400">${dataEnvioFormatada}</td>
        <td class="px-4 py-3 text-sm text-slate-400">
          ${n.diasRestantes !== null ? (n.diasRestantes >= 0 ? `${n.diasRestantes} dias` : `Vencido há ${Math.abs(n.diasRestantes)} dias`) : 'N/A'}
        </td>
      </tr>
    `;
  }).join('');

  // Atualizar paginação
  const paginacao = document.getElementById('notificacoes-paginacao');
  if (paginacao && data.totalPages > 1) {
    let html = '';
    for (let i = 1; i <= Math.min(data.totalPages, 10); i++) {
      html += `
        <button 
          class="px-3 py-1 rounded ${i === data.page ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
          onclick="carregarNotificacoesPagina(${i})"
        >
          ${i}
        </button>
      `;
    }
    paginacao.innerHTML = html;
  }
}

function setupNotificacoesFilters() {
  const filtroTipo = document.getElementById('notificacoes-filtro-tipo');
  const filtroSecretaria = document.getElementById('notificacoes-filtro-secretaria');
  const filtroStatus = document.getElementById('notificacoes-filtro-status');
  const btnAplicar = document.getElementById('notificacoes-btn-aplicar');
  const btnLimpar = document.getElementById('notificacoes-btn-limpar');

  if (btnAplicar) {
    btnAplicar.addEventListener('click', () => {
      aplicarFiltros();
    });
  }

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      if (filtroTipo) filtroTipo.value = '';
      if (filtroSecretaria) filtroSecretaria.value = '';
      if (filtroStatus) filtroStatus.value = '';
      aplicarFiltros();
    });
  }
}

async function aplicarFiltros() {
  const filtroTipo = document.getElementById('notificacoes-filtro-tipo');
  const filtroSecretaria = document.getElementById('notificacoes-filtro-secretaria');
  const filtroStatus = document.getElementById('notificacoes-filtro-status');

  const params = new URLSearchParams();
  if (filtroTipo?.value) params.set('tipo', filtroTipo.value);
  if (filtroSecretaria?.value) params.set('secretaria', filtroSecretaria.value);
  if (filtroStatus?.value) params.set('status', filtroStatus.value);

  try {
    const data = await window.dataLoader?.load(`/api/notificacoes?${params.toString()}&limit=50`, {
      useDataStore: false, // Sem cache para filtros
      ttl: 0
    });

    renderNotificacoes(data);
  } catch (error) {
    window.Logger?.error('Erro ao aplicar filtros:', error);
    showError('Erro ao aplicar filtros');
  }
}

async function carregarNotificacoesPagina(page) {
  try {
    const data = await window.dataLoader?.load(`/api/notificacoes?page=${page}&limit=50`, {
      useDataStore: false,
      ttl: 0
    });

    renderNotificacoes(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    window.Logger?.error('Erro ao carregar página:', error);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('notificacoes-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
      errorDiv.classList.add('hidden');
    }, 5000);
  }
}

// Variáveis globais para controle manual
let vencimentosAtuais = null;
let tipoVencimentoAtual = null;

function setupControleManual() {
  window.Logger?.debug('🔧 Configurando controle manual de envio...');
  
  const btnHoje = document.getElementById('notificacoes-btn-hoje');
  const btn15 = document.getElementById('notificacoes-btn-15');
  const btn60 = document.getElementById('notificacoes-btn-60');
  const btnEnviar = document.getElementById('notificacoes-btn-enviar');
  const btnSelecionarTodos = document.getElementById('notificacoes-btn-selecionar-todos');

  // Debug: verificar se os botões foram encontrados
  window.Logger?.debug('Botões encontrados:', {
    btnHoje: !!btnHoje,
    btn15: !!btn15,
    btn60: !!btn60,
    btnEnviar: !!btnEnviar,
    btnSelecionarTodos: !!btnSelecionarTodos
  });

  // Handlers nomeados
  const handlerHoje = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.Logger?.info('Botão "Vencimento Hoje" clicado');
    carregarVencimentos('hoje');
  };

  const handler15 = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.Logger?.info('Botão "15 Dias Antes" clicado');
    carregarVencimentos('15');
  };

  const handler60 = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.Logger?.info('Botão "60+ Dias Vencido" clicado');
    carregarVencimentos('60');
  };

  const handlerEnviar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.Logger?.info('Botão "Enviar Emails" clicado');
    enviarEmailsSelecionados();
  };

  // Armazenar handlers nos elementos para poder remover depois
  if (btnHoje) {
    // Remover handler anterior se existir
    if (btnHoje._handlerHoje) {
      btnHoje.removeEventListener('click', btnHoje._handlerHoje);
    }
    btnHoje._handlerHoje = handlerHoje;
    btnHoje.addEventListener('click', handlerHoje);
    window.Logger?.debug('✅ Listener adicionado ao botão "Vencimento Hoje"');
  } else {
    window.Logger?.warn('⚠️ Botão "notificacoes-btn-hoje" não encontrado!');
  }

  if (btn15) {
    if (btn15._handler15) {
      btn15.removeEventListener('click', btn15._handler15);
    }
    btn15._handler15 = handler15;
    btn15.addEventListener('click', handler15);
    window.Logger?.debug('✅ Listener adicionado ao botão "15 Dias Antes"');
  } else {
    window.Logger?.warn('⚠️ Botão "notificacoes-btn-15" não encontrado!');
  }

  if (btn60) {
    if (btn60._handler60) {
      btn60.removeEventListener('click', btn60._handler60);
    }
    btn60._handler60 = handler60;
    btn60.addEventListener('click', handler60);
    window.Logger?.debug('✅ Listener adicionado ao botão "60+ Dias Vencido"');
  } else {
    window.Logger?.warn('⚠️ Botão "notificacoes-btn-60" não encontrado!');
  }

  if (btnEnviar) {
    if (btnEnviar._handlerEnviar) {
      btnEnviar.removeEventListener('click', btnEnviar._handlerEnviar);
    }
    btnEnviar._handlerEnviar = handlerEnviar;
    btnEnviar.addEventListener('click', handlerEnviar);
    window.Logger?.debug('✅ Listener adicionado ao botão "Enviar Emails"');
  } else {
    window.Logger?.warn('⚠️ Botão "notificacoes-btn-enviar" não encontrado!');
  }

  if (btnSelecionarTodos) {
    const handlerSelecionarTodos = () => {
      const checkboxes = document.querySelectorAll('#notificacoes-lista-emails input[type="checkbox"]:not(:disabled)');
      const todosSelecionados = Array.from(checkboxes).every(cb => cb.checked);
      checkboxes.forEach(cb => {
        cb.checked = !todosSelecionados;
      });
      atualizarContadorSelecionados();
    };
    btnSelecionarTodos.removeEventListener('click', handlerSelecionarTodos);
    btnSelecionarTodos.addEventListener('click', handlerSelecionarTodos);
    window.Logger?.debug('✅ Listener adicionado ao botão "Selecionar Todos"');
  } else {
    window.Logger?.warn('⚠️ Botão "notificacoes-btn-selecionar-todos" não encontrado!');
  }

  window.Logger?.debug('✅ Controle manual configurado');
}

async function carregarVencimentos(tipo) {
  try {
    window.Logger?.info(`Carregando vencimentos: ${tipo}`);

    const loadingDiv = document.getElementById('notificacoes-controle-loading');
    const painelDiv = document.getElementById('notificacoes-painel-vencimentos');
    const listaDiv = document.getElementById('notificacoes-lista-emails');
    const listaContainer = document.getElementById('notificacoes-lista-emails-container');

    // Desabilitar botões durante carregamento
    document.querySelectorAll('[data-tipo-vencimento]').forEach(btn => {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
    });

    // Mostrar loading
    if (loadingDiv) {
      loadingDiv.classList.remove('hidden');
      loadingDiv.innerHTML = `
        <div class="inline-flex items-center gap-2 text-slate-400">
          <span class="animate-spin text-lg">⏳</span>
          <span>Buscando vencimentos... (isso pode levar alguns segundos)</span>
        </div>
      `;
    }
    if (painelDiv) painelDiv.classList.add('hidden');
    if (listaDiv) listaDiv.innerHTML = '';
    if (listaContainer) listaContainer.classList.add('hidden');

    // Carregar dados usando dataLoader
    const inicio = Date.now();
    const data = await window.dataLoader?.load(`/api/notificacoes/vencimentos?tipo=${tipo}`, {
      useDataStore: false, // Sem cache para garantir dados frescos
      ttl: 0
    });
    const tempo = ((Date.now() - inicio) / 1000).toFixed(1);

    window.Logger?.debug(`Dados recebidos em ${tempo}s:`, data);

    vencimentosAtuais = data;
    tipoVencimentoAtual = tipo;

    if (loadingDiv) loadingDiv.classList.add('hidden');
    if (painelDiv) painelDiv.classList.remove('hidden');

    renderPainelVencimentos(data);
    renderListaEmails(data);
    
    // Mostrar container da lista se houver dados
    if (listaContainer && data && data.emails && data.emails.length > 0) {
      listaContainer.classList.remove('hidden');
    } else if (listaContainer) {
      listaContainer.classList.add('hidden');
    }

    // Atualizar botões ativos e reabilitar
    document.querySelectorAll('[data-tipo-vencimento]').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.classList.toggle('ring-2', btn.dataset.tipoVencimento === tipo);
      btn.classList.toggle('ring-blue-500', btn.dataset.tipoVencimento === tipo);
    });

    if (data && data.totalProtocolos > 0) {
      window.Logger?.info(`✅ ${data.totalProtocolos} protocolos encontrados em ${tempo}s`);
    }

  } catch (error) {
    window.Logger?.error('Erro ao carregar vencimentos:', error);
    showError(`Erro ao carregar vencimentos: ${error.message || error}`);
    
    const loadingDiv = document.getElementById('notificacoes-controle-loading');
    if (loadingDiv) loadingDiv.classList.add('hidden');
    
    document.querySelectorAll('[data-tipo-vencimento]').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    });
  }
}

function renderPainelVencimentos(data) {
  const painel = document.getElementById('notificacoes-painel-vencimentos');
  if (!painel || !data) return;

  const labels = {
    'hoje': 'Vencimento Hoje',
    '15': 'Vencimento em 15 Dias',
    '60': 'Vencimento há 60+ Dias'
  };

  let html = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-cyan-400">${labels[data.tipo] || data.tipo}</h3>
        <div class="text-sm text-slate-400">
          Data alvo: <span class="font-mono">${data.dataAlvo}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-3 gap-4">
        <div class="glass rounded-lg p-4 border border-cyan-500/20">
          <div class="text-xs text-slate-400 mb-1">Secretarias</div>
          <div class="text-2xl font-bold text-cyan-300">${data.totalSecretarias || 0}</div>
        </div>
        <div class="glass rounded-lg p-4 border border-green-500/20">
          <div class="text-xs text-slate-400 mb-1">Protocolos</div>
          <div class="text-2xl font-bold text-green-300">${data.totalProtocolos || 0}</div>
        </div>
        <div class="glass rounded-lg p-4 border border-yellow-500/20">
          <div class="text-xs text-slate-400 mb-1">Média por Secretaria</div>
          <div class="text-2xl font-bold text-yellow-300">
            ${data.totalSecretarias > 0 ? Math.round(data.totalProtocolos / data.totalSecretarias) : 0}
          </div>
        </div>
      </div>
    </div>
  `;

  painel.innerHTML = html;
}

function renderListaEmails(data) {
  const lista = document.getElementById('notificacoes-lista-emails');
  if (!lista || !data || !data.emails || data.emails.length === 0) {
    if (lista) {
      lista.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          Nenhum vencimento encontrado para este período
        </div>
      `;
    }
    return;
  }

  let html = `
    <div class="space-y-3">
      ${data.emails.map((email, index) => {
        const temJaNotificados = email.jaNotificados > 0;
        return `
          <div class="glass rounded-lg p-4 border ${temJaNotificados ? 'border-yellow-500/30' : 'border-slate-700'}">
            <div class="flex items-start gap-3">
              <input 
                type="checkbox" 
                id="email-${index}"
                class="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                ${temJaNotificados ? 'disabled' : ''}
                data-secretaria="${email.secretaria}"
              >
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <h4 class="font-semibold text-slate-200">${email.secretaria}</h4>
                    <p class="text-sm text-slate-400">${email.email}</p>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-cyan-300">${email.totalProtocolos}</div>
                    <div class="text-xs text-slate-400">protocolo${email.totalProtocolos !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                ${temJaNotificados ? `
                  <div class="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1 inline-block mb-2">
                    ⚠️ ${email.jaNotificados} já notificado${email.jaNotificados !== 1 ? 's' : ''} anteriormente
                  </div>
                ` : ''}
                <div class="mt-2 text-xs text-slate-500">
                  Protocolos: ${email.protocolos.slice(0, 5).map(p => p.protocolo).join(', ')}
                  ${email.protocolos.length > 5 ? ` (+${email.protocolos.length - 5} mais)` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  lista.innerHTML = html;

  // Adicionar listeners aos checkboxes
  document.querySelectorAll('#notificacoes-lista-emails input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', atualizarContadorSelecionados);
  });

  atualizarContadorSelecionados();
}

function atualizarContadorSelecionados() {
  const checkboxes = document.querySelectorAll('#notificacoes-lista-emails input[type="checkbox"]:not(:disabled)');
  const selecionados = Array.from(checkboxes).filter(cb => cb.checked).length;
  const total = checkboxes.length;

  const contador = document.getElementById('notificacoes-contador-selecionados');
  if (contador) {
    contador.textContent = `${selecionados} de ${total} selecionado${total !== 1 ? 's' : ''}`;
  }

  const btnEnviar = document.getElementById('notificacoes-btn-enviar');
  if (btnEnviar) {
    btnEnviar.disabled = selecionados === 0;
    btnEnviar.classList.toggle('opacity-50', selecionados === 0);
    btnEnviar.classList.toggle('cursor-not-allowed', selecionados === 0);
  }
}

async function enviarEmailsSelecionados() {
  if (!vencimentosAtuais || !tipoVencimentoAtual) {
    showError('Carregue os vencimentos primeiro');
    return;
  }

  const checkboxes = document.querySelectorAll('#notificacoes-lista-emails input[type="checkbox"]:checked:not(:disabled)');
  const secretarias = Array.from(checkboxes).map(cb => cb.dataset.secretaria);

  if (secretarias.length === 0) {
    showError('Selecione pelo menos uma secretaria');
    return;
  }

  // Calcular total de protocolos
  const totalProtocolos = secretarias.reduce((sum, sec) => {
    const email = vencimentosAtuais.emails.find(e => e.secretaria === sec);
    return sum + (email?.totalProtocolos || 0);
  }, 0);

  if (!confirm(`Deseja enviar emails para ${secretarias.length} secretaria(s) (${totalProtocolos} protocolo${totalProtocolos !== 1 ? 's' : ''})?`)) {
    return;
  }

  const btnEnviar = document.getElementById('notificacoes-btn-enviar');
  const loadingDiv = document.getElementById('notificacoes-envio-loading');
  const resultadoDiv = document.getElementById('notificacoes-envio-resultado');

  if (btnEnviar) {
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';
    btnEnviar.classList.add('opacity-50', 'cursor-not-allowed');
  }

  if (loadingDiv) {
    loadingDiv.classList.remove('hidden');
    loadingDiv.innerHTML = `
      <div class="inline-flex items-center gap-2 text-slate-400">
        <span class="animate-spin inline-block mr-2">⏳</span>
        <span>Enviando emails para ${secretarias.length} secretaria(s)...</span>
      </div>
    `;
  }
  if (resultadoDiv) resultadoDiv.classList.add('hidden');

  try {
    const resultado = await fetch('/api/notificacoes/enviar-selecionados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo: tipoVencimentoAtual,
        secretarias: secretarias
      })
    });

    const data = await resultado.json();

    if (loadingDiv) loadingDiv.classList.add('hidden');
    if (resultadoDiv) resultadoDiv.classList.remove('hidden');

    let html = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-slate-200">Resultado do Envio</h4>
          <div class="text-sm">
            <span class="text-green-400">✓ ${data.enviados} enviado${data.enviados !== 1 ? 's' : ''}</span>
            ${data.erros > 0 ? `<span class="text-red-400 ml-3">✗ ${data.erros} erro${data.erros !== 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          ${data.detalhes.map(d => `
            <div class="text-sm p-2 rounded ${d.status === 'enviado' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}">
              <div class="font-semibold ${d.status === 'enviado' ? 'text-green-400' : 'text-red-400'}">
                ${d.secretaria}
              </div>
              <div class="text-xs text-slate-400 mt-1">
                ${d.status === 'enviado' 
                  ? `Email: ${d.email} | ${d.protocolos} protocolo${d.protocolos !== 1 ? 's' : ''}`
                  : `Erro: ${d.motivo || 'Erro desconhecido'}`
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (resultadoDiv) {
      resultadoDiv.innerHTML = html;
    }

    // Recarregar vencimentos para atualizar status
    setTimeout(() => {
      carregarVencimentos(tipoVencimentoAtual);
    }, 2000);

    // Recarregar estatísticas
    setTimeout(() => {
      loadNotificacoes();
    }, 3000);

  } catch (error) {
    window.Logger?.error('Erro ao enviar emails:', error);
    showError('Erro ao enviar emails: ' + error.message);
    
    if (loadingDiv) loadingDiv.classList.add('hidden');
  } finally {
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = '📧 Enviar Emails Selecionados';
      btnEnviar.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

// Exportar função global
window.loadNotificacoes = loadNotificacoes;

