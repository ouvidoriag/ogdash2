/**
 * Página: Unidades de Saúde (Dinâmico)
 * Páginas dinâmicas para cada unidade de saúde
 * 
 * Recriada com estrutura otimizada
 */

async function loadUnit(unitName) {
  if (window.Logger) {
    window.Logger.debug(`🏥 loadUnit: ${unitName}`);
  }
  
  // Mapear nomes das unidades
  const unitMap = {
    'adao': 'ADÃO',
    'cer iv': 'CER IV',
    'cer-iv': 'CER IV',
    'hospital olho': 'Hospital do Olho',
    'hospital-duque': 'Hospital Duque',
    'hospital duque': 'Hospital Duque',
    'hospital infantil': 'Hospital Infantil',
    'hospital-infantil': 'Hospital Infantil',
    'hospital moacyr': 'Hospital Moacyr',
    'hospital-moacyr': 'Hospital Moacyr',
    'maternidade santa cruz': 'Maternidade Santa Cruz',
    'maternidade-santa-cruz': 'Maternidade Santa Cruz',
    'upa beira mar': 'UPA Beira Mar',
    'upa-beira-mar': 'UPA Beira Mar',
    'uph pilar': 'UPH Pilar',
    'uph-pilar': 'UPH Pilar',
    'uph saracuruna': 'UPH Saracuruna',
    'uph-saracuruna': 'UPH Saracuruna',
    'uph xerem': 'UPH Xerém',
    'uph-xerem': 'UPH Xerém',
    'hospital veterinario': 'Hospital Veterinário',
    'hospital-veterinario': 'Hospital Veterinário',
    'upa walter garcia': 'UPA Walter Garcia',
    'upa-walter-garcia': 'UPA Walter Garcia',
    'uph campos eliseos': 'UPH Campos Elíseos',
    'uph-campos-eliseos': 'UPH Campos Elíseos',
    'uph parque equitativa': 'UPH Parque Equitativa',
    'uph-parque-equitativa': 'UPH Parque Equitativa',
    'ubs antonio granja': 'UBS Antonio Granja',
    'ubs-antonio-granja': 'UBS Antonio Granja',
    'upa sarapui': 'UPA Sarapuí',
    'upa-sarapui': 'UPA Sarapuí',
    'uph imbarie': 'UPH Imbariê',
    'uph-imbarie': 'UPH Imbariê'
  };
  
  const searchName = unitMap[unitName.toLowerCase()] || unitName;
  const pageId = `page-unit-${unitName.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Garantir que a página existe (criar dinamicamente se necessário)
  let section = document.getElementById(pageId);
  if (!section && window.ensureUnitPageExists) {
    section = window.ensureUnitPageExists(unitName.replace(/\s+/g, '-').toLowerCase());
  }
  
  if (!section || section.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load(`/api/unit/${encodeURIComponent(searchName)}`, {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || null;
    
    if (!data) return;
    
    const assuntos = data.assuntos || [];
    const tipos = data.tipos || [];
    
    // Renderizar lista de assuntos
    const assuntosContainer = section.querySelector('.unit-assuntos');
    if (assuntosContainer) {
      renderUnitAssuntosList(assuntosContainer, assuntos);
    }
    
    // Renderizar gráfico de tipos
    const tiposCanvas = section.querySelector('.unit-tipos');
    if (tiposCanvas && tipos.length > 0) {
      await renderTiposChart(tiposCanvas, tipos, unitName);
    }
    
    if (window.Logger) {
      window.Logger.success(`🏥 loadUnit: ${unitName} concluído`);
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao carregar Unidade ${unitName}:`, error);
    }
  }
}

function renderUnitAssuntosList(container, assuntos) {
  if (!container) return;
  
  if (!assuntos || assuntos.length === 0) {
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

async function renderTiposChart(canvas, tipos, unitName) {
  const labels = tipos.map(t => t.tipo || t.key || t._id || 'N/A');
  const values = tipos.map(t => t.quantidade || t.count || 0);
  const chartId = `chartUnit${unitName.replace(/\s+/g, '').replace(/-/g, '')}Tipos`;
  
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

window.loadUnit = loadUnit;

