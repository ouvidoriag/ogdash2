/**
 * Página: Unidades de Saúde (Unificada)
 * Página única com dropdown para selecionar unidades
 * 
 * Recriada com estrutura otimizada
 */

// Lista de unidades organizadas por tipo
const unidadesPorTipo = {
  'Hospital': [
    { nome: 'Hospital Municipal Doutor Moacyr Rodrigues do Carmo', busca: 'Hospital Moacyr' },
    { nome: 'Hospital Municipalizado Adão Pereira Nunes', busca: 'ADÃO' },
    { nome: 'Hospital do Coração São José', busca: 'Hospital do Coração' }
  ],
  'Hospital Especializado': [
    { nome: 'Hospital do Olho – Júlio Cândido de Brito', busca: 'Hospital do Olho' },
    { nome: 'Hospital Infantil Ismélia da Silveira', busca: 'Hospital Infantil' },
    { nome: 'Hospital Infantil de Parada Angélica Padre Guilherme', busca: 'Hospital Infantil Parada Angélica' },
    { nome: 'Hospital Veterinário', busca: 'Hospital Veterinário' }
  ],
  'Maternidade': [
    { nome: 'Maternidade Municipal Santa Cruz da Serra', busca: 'Maternidade Santa Cruz' }
  ],
  'UPA': [
    { nome: 'UPA Parque Beira Mar', busca: 'UPA Beira Mar' },
    { nome: 'UPA Walter Garcia', busca: 'UPA Walter Garcia' },
    { nome: 'UPA Parque Lafaiete', busca: 'UPA Parque Lafaiete' },
    { nome: 'UPA Sarapuí', busca: 'UPA Sarapuí' }
  ],
  'UPH': [
    { nome: 'UPH Pilar – José Moreira da Silva', busca: 'UPH Pilar' },
    { nome: 'UPH Saracuruna – João Pedro Carletti', busca: 'UPH Saracuruna' },
    { nome: 'UPH Xerém – José Evangelista de Souza', busca: 'UPH Xerém' },
    { nome: 'UPH Campos Elíseos', busca: 'UPH Campos Elíseos' },
    { nome: 'UPH Parque Equitativa', busca: 'UPH Parque Equitativa' },
    { nome: 'UPH Imbariê – Dr. Jorge Rodrigues Pereira', busca: 'UPH Imbariê' }
  ],
  'Centro Especializado': [
    { nome: 'Centro Especializado de Reabilitação – CER IV', busca: 'CER IV' },
    { nome: 'CEATA – Centro de Atenção Total ao Adolescente', busca: 'CEATA' },
    { nome: 'CEAPD – Centro de Atenção ao Portador de Deficiência (CER II)', busca: 'CEAPD' },
    { nome: 'Centro de Referência e Atenção Especializada à Saúde da Mulher', busca: 'Centro de Referência Saúde da Mulher' },
    { nome: 'Fazenda Paraíso', busca: 'Fazenda Paraíso' },
    { nome: 'Centro de Fisioterapia Pastor Norival Franco', busca: 'Centro de Fisioterapia' }
  ],
  'Centro de Saúde': [
    { nome: 'Centro Municipal de Saúde de Duque de Caxias', busca: 'Centro Municipal de Saúde' }
  ],
  'Policlínica': [
    { nome: 'Policlínica Hospital Municipal Duque de Caxias', busca: 'Hospital Duque' }
  ],
  'UBS': [
    { nome: 'UBS Antonio Granja', busca: 'UBS Antonio Granja' }
  ]
};

let unidadesLista = [];
let unidadeSelecionada = null;

async function loadUnidadesSaude() {
  if (window.Logger) {
    window.Logger.debug('🏥 loadUnidadesSaude: Iniciando');
  }
  
  const page = document.getElementById('page-unidades-saude');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    // Popular dropdown se ainda não foi populado
    if (unidadesLista.length === 0) {
      popularDropdown();
    }
    
    // Se já houver uma unidade selecionada, recarregar seus dados
    if (unidadeSelecionada) {
      await carregarDadosUnidade(unidadeSelecionada);
    } else {
      // Mostrar mensagem para selecionar uma unidade
      mostrarMensagemSelecao();
    }
    
    if (window.Logger) {
      window.Logger.success('🏥 loadUnidadesSaude: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar Unidades de Saúde:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Unidades de Saúde:', error);
    }
  }
}

function popularDropdown() {
  const select = document.getElementById('selectUnidade');
  if (!select) return;
  
  unidadesLista = [];
  
  // Adicionar opção padrão
  const optionDefault = document.createElement('option');
  optionDefault.value = '';
  optionDefault.textContent = 'Selecione uma unidade...';
  optionDefault.disabled = true;
  optionDefault.selected = true;
  select.appendChild(optionDefault);
  
  // Agrupar por tipo
  Object.entries(unidadesPorTipo).forEach(([tipo, unidades]) => {
    // Adicionar optgroup
    const optgroup = document.createElement('optgroup');
    optgroup.label = tipo;
    
    unidades.forEach(unidade => {
      const option = document.createElement('option');
      option.value = unidade.busca;
      option.textContent = unidade.nome;
      option.dataset.tipo = tipo;
      optgroup.appendChild(option);
      unidadesLista.push(unidade);
    });
    
    select.appendChild(optgroup);
  });
  
  // Adicionar listener para mudança de seleção
  select.addEventListener('change', async (e) => {
    const busca = e.target.value;
    if (busca) {
      const unidade = unidadesLista.find(u => u.busca === busca);
      if (unidade) {
        unidadeSelecionada = unidade;
        await carregarDadosUnidade(unidade);
      }
    } else {
      unidadeSelecionada = null;
      mostrarMensagemSelecao();
    }
  });
}

function mostrarMensagemSelecao() {
  const container = document.getElementById('unidadeConteudo');
  if (!container) return;
  
  container.innerHTML = `
    <div class="glass rounded-2xl p-12 text-center">
      <div class="text-6xl mb-4">🏥</div>
      <h3 class="text-xl font-semibold text-slate-300 mb-2">Selecione uma Unidade de Saúde</h3>
      <p class="text-slate-400">Use o menu acima para escolher uma unidade e visualizar seus dados</p>
    </div>
  `;
}

async function carregarDadosUnidade(unidade) {
  if (window.Logger) {
    window.Logger.debug(`🏥 carregarDadosUnidade: ${unidade.nome}`);
  }
  
  const container = document.getElementById('unidadeConteudo');
  if (!container) return;
  
  // Mostrar loading
  container.innerHTML = `
    <div class="glass rounded-2xl p-12 text-center">
      <div class="text-4xl mb-4 animate-pulse">⏳</div>
      <p class="text-slate-400">Carregando dados de ${unidade.nome}...</p>
    </div>
  `;
  
  try {
    const data = await window.dataLoader?.load(`/api/unit/${encodeURIComponent(unidade.busca)}`, {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || null;
    
    if (!data || (!data.assuntos || data.assuntos.length === 0) && (!data.tipos || data.tipos.length === 0)) {
      container.innerHTML = `
        <div class="glass rounded-2xl p-12 text-center">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold text-slate-300 mb-2">Nenhum dado encontrado</h3>
          <p class="text-slate-400">Não há registros para ${unidade.nome}</p>
        </div>
      `;
      return;
    }
    
    const assuntos = data.assuntos || [];
    const tipos = data.tipos || [];
    
    // Renderizar conteúdo
    container.innerHTML = `
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8 glass rounded-2xl p-5">
          <h3 class="font-semibold mb-4 text-cyan-400">📋 Assuntos</h3>
          <div id="unidadeAssuntos" class="space-y-2 max-h-[600px] overflow-y-auto"></div>
        </div>
        <div class="col-span-12 lg:col-span-4 glass rounded-2xl p-5">
          <h3 class="font-semibold mb-4 text-cyan-400">📊 Tipos de Manifestação</h3>
          <canvas id="unidadeTiposChart"></canvas>
        </div>
      </div>
    `;
    
    // Renderizar lista de assuntos
    const assuntosContainer = document.getElementById('unidadeAssuntos');
    if (assuntosContainer) {
      renderUnidadeAssuntosList(assuntosContainer, assuntos);
    }
    
    // Renderizar gráfico de tipos
    const tiposCanvas = document.getElementById('unidadeTiposChart');
    if (tiposCanvas && tipos && tipos.length > 0) {
      await renderUnidadeTiposChart(tiposCanvas, tipos, unidade.busca);
    }
    
    if (window.Logger) {
      window.Logger.success(`🏥 carregarDadosUnidade: ${unidade.nome} concluído`);
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar dados de ${unidade.nome}:`, error);
    container.innerHTML = `
      <div class="glass rounded-2xl p-12 text-center">
        <div class="text-6xl mb-4">❌</div>
        <h3 class="text-xl font-semibold text-red-400 mb-2">Erro ao carregar dados</h3>
        <p class="text-slate-400">${error.message || 'Erro desconhecido'}</p>
      </div>
    `;
    if (window.Logger) {
      window.Logger.error(`Erro ao carregar dados de ${unidade.nome}:`, error);
    }
  }
}

function renderUnidadeAssuntosList(container, assuntos) {
  if (!container) return;
  
  if (!assuntos || !Array.isArray(assuntos) || assuntos.length === 0) {
    container.innerHTML = '<div class="text-center text-slate-400 py-4">Nenhum assunto encontrado</div>';
    return;
  }
  
  const maxValue = Math.max(...assuntos.map(d => d.quantidade || d.count || 0), 1);
  container.innerHTML = assuntos.map((item, idx) => {
    const quantidade = item.quantidade || item.count || 0;
    const width = (quantidade / maxValue) * 100;
    const assunto = item.assunto || item.key || item._id || 'N/A';
    return `
      <div class="flex items-center gap-3 py-2 border-b border-white/5">
        <div class="text-sm text-slate-400 w-8">${idx + 1}º</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-300 truncate">${assunto}</div>
          <div class="mt-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-violet-500" style="width: ${width}%"></div>
          </div>
        </div>
        <div class="text-lg font-bold text-cyan-300 min-w-[80px] text-right">${quantidade.toLocaleString('pt-BR')}</div>
      </div>
    `;
  }).join('');
}

async function renderUnidadeTiposChart(canvas, tipos, unitName) {
  if (!canvas || !tipos || !Array.isArray(tipos) || tipos.length === 0) return;
  
  const labels = tipos.map(t => t.tipo || t.key || t._id || 'N/A');
  const values = tipos.map(t => t.quantidade || t.count || 0);
  const chartId = `chartUnidade${unitName.replace(/\s+/g, '').replace(/-/g, '')}Tipos`;
  
  // Criar canvas se não existir
  if (!canvas.id) {
    canvas.id = chartId;
  }
  
  await window.chartFactory?.createDoughnutChart(chartId, labels, values, {
    type: 'doughnut',
    field: 'tipoDeManifestacao',
    onClick: true, // Habilitar comunicação e filtros
    chartOptions: {
      plugins: {
        legend: { display: true, position: 'right', labels: { color: '#94a3b8' } }
      }
    }
  });
}

/**
 * Inicializar listeners de filtro para a página Unidades de Saúde
 */
function initUnidadesSaudeFilterListeners() {
  if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
    window.chartCommunication.createPageFilterListener('page-unidades-saude', loadUnidadesSaude, 500);
    if (window.Logger) {
      window.Logger.success('✅ Listeners de filtro para Unidades de Saúde inicializados');
    }
  }
}

// Inicializar listeners quando o script carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnidadesSaudeFilterListeners);
} else {
  initUnidadesSaudeFilterListeners();
}

window.loadUnidadesSaude = loadUnidadesSaude;

