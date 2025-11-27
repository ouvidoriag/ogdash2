/**
 * Página: Secretarias e Distritos
 * Análise cruzada secretarias × distritos
 * 
 * Recriada com estrutura otimizada
 */

async function loadSecretariasDistritos() {
  if (window.Logger) {
    window.Logger.debug('🗺️ loadSecretariasDistritos: Iniciando');
  }
  
  const page = document.getElementById('page-secretarias-distritos');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  // Mostrar estado de carregamento
  const listaEl = document.getElementById('listaDistritos');
  const estatisticasEl = document.getElementById('estatisticasDistritos');
  const chartEl = document.getElementById('chartSecretariasDistritos');
  
  if (listaEl) {
    listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Carregando distritos...</div>';
  }
  if (estatisticasEl) {
    estatisticasEl.innerHTML = '<div class="text-center text-slate-400 py-4">Carregando estatísticas...</div>';
  }
  
  try {
    // Limpar cache se os dados anteriores estavam vazios
    const cachedData = window.dataStore?.get('/api/distritos', 0);
    if (cachedData && (!cachedData.distritos || Object.keys(cachedData.distritos || {}).length === 0)) {
      console.log('🗑️ Limpando cache vazio de /api/distritos');
      window.dataStore?.clear('/api/distritos');
    }
    
    const distritosData = await window.dataLoader?.load('/api/distritos', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || null;
    
    if (!distritosData) {
      if (listaEl) {
        listaEl.innerHTML = '<div class="text-center text-red-400 py-4">❌ Erro: Não foi possível carregar dados da API</div>';
      }
      if (estatisticasEl) {
        estatisticasEl.innerHTML = '<div class="text-center text-red-400 py-4">❌ Erro ao carregar estatísticas</div>';
      }
      console.error('❌ loadSecretariasDistritos: distritosData é null');
      return;
    }
    
    if (!distritosData.distritos || Object.keys(distritosData.distritos).length === 0) {
      if (listaEl) {
        listaEl.innerHTML = '<div class="text-center text-amber-400 py-4">⚠️ Nenhum distrito encontrado nos dados</div>';
      }
      if (estatisticasEl) {
        estatisticasEl.innerHTML = '<div class="text-center text-amber-400 py-4">⚠️ Estatísticas não disponíveis</div>';
      }
      console.warn('⚠️ loadSecretariasDistritos: distritos está vazio ou não existe');
      return;
    }
    
    const distritos = distritosData.distritos;
    const estatisticas = distritosData.estatisticas || {};
    
    // Renderizar lista de distritos
    renderDistritosList(distritos, estatisticas);
    
    // Renderizar estatísticas
    renderDistritosEstatisticas(estatisticas);
    
    // Atualizar KPIs no header
    updateSecretariasDistritosKPIs(estatisticas);
    
    // Renderizar gráfico de distribuição
    if (estatisticas.secretariasPorDistrito && Object.keys(estatisticas.secretariasPorDistrito).length > 0) {
      await renderSecretariasDistritosChart(estatisticas.secretariasPorDistrito);
    } else {
      // Mostrar mensagem se não houver dados para o gráfico
      if (chartEl && chartEl.parentElement) {
        const chartContainer = chartEl.parentElement;
        const existingMsg = chartContainer.querySelector('.chart-error-msg');
        if (!existingMsg) {
          const msg = document.createElement('div');
          msg.className = 'chart-error-msg text-center text-amber-400 py-4 text-sm';
          msg.textContent = '⚠️ Dados de secretarias por distrito não disponíveis';
          chartContainer.appendChild(msg);
        }
      }
    }
    
    if (window.Logger) {
      window.Logger.success('🗺️ loadSecretariasDistritos: Concluído');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar SecretariasDistritos:', error);
    if (window.Logger) {
      window.Logger.error('Erro ao carregar SecretariasDistritos:', error);
    }
    
    // Mostrar mensagem de erro detalhada
    if (listaEl) {
      listaEl.innerHTML = `<div class="text-center text-red-400 py-4">
        ❌ Erro ao carregar dados<br>
        <span class="text-xs text-slate-500">${error.message || 'Erro desconhecido'}</span>
      </div>`;
    }
    if (estatisticasEl) {
      estatisticasEl.innerHTML = '<div class="text-center text-red-400 py-4">❌ Erro ao carregar estatísticas</div>';
    }
  }
}

function renderDistritosList(distritos, estatisticas) {
  const listaDistritos = document.getElementById('listaDistritos');
  if (!listaDistritos) return;
  
  listaDistritos.innerHTML = Object.entries(distritos).map(([nome, info]) => `
    <div class="distrito-item p-4 rounded-lg border border-white/10 hover:border-cyan-400/50 hover:bg-white/5 cursor-pointer transition-all" 
         data-distrito="${nome}" 
         data-code="${info.code || ''}">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-semibold text-cyan-300">${nome}</div>
          <div class="text-xs text-slate-400 mt-1">
            ${info.bairros ? info.bairros.length + ' bairros' : ''}
            ${estatisticas.secretariasPorDistrito && estatisticas.secretariasPorDistrito[nome] 
              ? ' • ' + estatisticas.secretariasPorDistrito[nome] + ' secretarias' 
              : ''}
          </div>
        </div>
        <div class="text-2xl">${info.code || '📍'}</div>
      </div>
    </div>
  `).join('');
  
  // Adicionar event listeners
  listaDistritos.querySelectorAll('.distrito-item').forEach(item => {
    item.addEventListener('click', async () => {
      listaDistritos.querySelectorAll('.distrito-item').forEach(i => {
        i.classList.remove('border-cyan-400', 'bg-cyan-500/10');
        i.classList.add('border-white/10');
      });
      
      item.classList.remove('border-white/10');
      item.classList.add('border-cyan-400', 'bg-cyan-500/10');
      
      const distritoNome = item.dataset.distrito;
      const distritoCode = item.dataset.code;
      
      const nomeEl = document.getElementById('distritoSelecionadoNome');
      if (nomeEl) nomeEl.textContent = distritoNome;
      
      // Carregar secretarias do distrito (se função existir)
      if (window.loadSecretariasPorDistrito) {
        await window.loadSecretariasPorDistrito(distritoNome, distritoCode);
      }
    });
  });
}

function renderDistritosEstatisticas(estatisticas) {
  const estatisticasDiv = document.getElementById('estatisticasDistritos');
  if (!estatisticasDiv) return;
  
  if (!estatisticas || typeof estatisticas !== 'object') {
    estatisticasDiv.innerHTML = '<div class="text-center text-slate-400 py-4">Estatísticas não disponíveis</div>';
    return;
  }
  
  estatisticasDiv.innerHTML = `
    <div class="glass rounded-xl p-4">
      <div class="text-slate-400 text-sm mb-1">Total de Secretarias</div>
      <div class="text-2xl font-bold text-cyan-300">${estatisticas.totalSecretarias || 0}</div>
    </div>
    <div class="glass rounded-xl p-4">
      <div class="text-slate-400 text-sm mb-1">Total de Distritos</div>
      <div class="text-2xl font-bold text-violet-300">${estatisticas.totalDistritos || 0}</div>
    </div>
    <div class="glass rounded-xl p-4">
      <div class="text-slate-400 text-sm mb-1">Total de Bairros</div>
      <div class="text-2xl font-bold text-emerald-300">${estatisticas.totalBairros || 0}</div>
    </div>
    <div class="glass rounded-xl p-4">
      <div class="text-slate-400 text-sm mb-1">Média Secretarias/Distrito</div>
      <div class="text-2xl font-bold text-amber-300">${estatisticas.totalSecretarias && estatisticas.totalDistritos 
        ? (estatisticas.totalSecretarias / estatisticas.totalDistritos).toFixed(1) 
        : 0}</div>
    </div>
  `;
}

async function renderSecretariasDistritosChart(secretariasPorDistrito) {
  const chartEl = document.getElementById('chartSecretariasDistritos');
  if (!chartEl) {
    console.error('❌ chartSecretariasDistritos não encontrado');
    return;
  }
  
  // Remover mensagem de erro anterior se existir
  const chartContainer = chartEl.parentElement;
  if (chartContainer) {
    const existingMsg = chartContainer.querySelector('.chart-error-msg');
    if (existingMsg) {
      existingMsg.remove();
    }
  }
  
  try {
    const distritoLabels = Object.keys(secretariasPorDistrito).map(d => 
      d.replace('º Distrito - ', '').split('(')[0].trim()
    );
    const distritoValues = Object.values(secretariasPorDistrito);
    
    if (distritoLabels.length === 0 || distritoValues.length === 0) {
      throw new Error('Dados vazios para o gráfico');
    }
    
    await window.chartFactory?.createBarChart('chartSecretariasDistritos', distritoLabels, distritoValues, {
      colorIndex: 9,
      label: 'Quantidade de Secretarias',
      onClick: true, // Habilitar comunicação e filtros
      chartOptions: {
        scales: {
          x: { ticks: { maxRotation: 45, minRotation: 45 } }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao renderizar gráfico:', error);
    if (chartContainer) {
      const msg = document.createElement('div');
      msg.className = 'chart-error-msg text-center text-red-400 py-4 text-sm';
      msg.textContent = `❌ Erro ao renderizar gráfico: ${error.message || 'Erro desconhecido'}`;
      chartContainer.appendChild(msg);
    }
  }
}

/**
 * Atualizar KPIs da página Secretarias e Distritos
 */
function updateSecretariasDistritosKPIs(estatisticas) {
  if (!estatisticas || typeof estatisticas !== 'object') {
    return;
  }
  
  const totalSecretarias = estatisticas.totalSecretarias || 0;
  const totalDistritos = estatisticas.totalDistritos || 0;
  const totalBairros = estatisticas.totalBairros || 0;
  const mediaSecretariasDistrito = totalSecretarias && totalDistritos 
    ? (totalSecretarias / totalDistritos).toFixed(1) 
    : '0';
  
  // Atualizar elementos
  const kpiSecretarias = document.getElementById('kpiTotalSecretariasDistritos');
  const kpiDistritos = document.getElementById('kpiTotalDistritos');
  const kpiBairros = document.getElementById('kpiTotalBairros');
  const kpiMedia = document.getElementById('kpiMediaSecretariasDistrito');
  
  if (kpiSecretarias) kpiSecretarias.textContent = totalSecretarias.toLocaleString('pt-BR');
  if (kpiDistritos) kpiDistritos.textContent = totalDistritos.toLocaleString('pt-BR');
  if (kpiBairros) kpiBairros.textContent = totalBairros.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaSecretariasDistrito;
}

window.loadSecretariasDistritos = loadSecretariasDistritos;

