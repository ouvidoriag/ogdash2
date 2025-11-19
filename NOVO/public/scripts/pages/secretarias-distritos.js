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
  
  try {
    const distritosData = await window.dataLoader?.load('/api/distritos', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || null;
    
    if (!distritosData || !distritosData.distritos) {
      const listaEl = document.getElementById('listaDistritos');
      if (listaEl) {
        listaEl.innerHTML = '<div class="text-center text-slate-400 py-4">Erro ao carregar dados de distritos</div>';
      }
      return;
    }
    
    const distritos = distritosData.distritos;
    const estatisticas = distritosData.estatisticas || {};
    
    // Renderizar lista de distritos
    renderDistritosList(distritos, estatisticas);
    
    // Renderizar estatísticas
    renderDistritosEstatisticas(estatisticas);
    
    // Renderizar gráfico de distribuição
    if (estatisticas.secretariasPorDistrito) {
      await renderSecretariasDistritosChart(estatisticas.secretariasPorDistrito);
    }
    
    if (window.Logger) {
      window.Logger.success('🗺️ loadSecretariasDistritos: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar SecretariasDistritos:', error);
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
  const distritoLabels = Object.keys(secretariasPorDistrito).map(d => 
    d.replace('º Distrito - ', '').split('(')[0].trim()
  );
  const distritoValues = Object.values(secretariasPorDistrito);
  
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
}

window.loadSecretariasDistritos = loadSecretariasDistritos;

