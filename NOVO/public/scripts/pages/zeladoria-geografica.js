/**
 * Página: Zeladoria - Análise Geográfica
 */

async function loadZeladoriaGeografica() {
  const page = document.getElementById('page-zeladoria-geografica');
  if (!page || page.style.display === 'none') return;
  
  try {
    const data = await window.dataLoader?.load('/api/zeladoria/geographic', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const content = document.getElementById('zeladoria-geografica-content');
    if (!content) return;
    
    if (data.length === 0) {
      content.innerHTML = '<p class="text-slate-400">Nenhum dado geográfico disponível</p>';
      return;
    }
    
    // Criar tabela com dados geográficos
    let html = '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-slate-700">';
    html += '<th class="text-left p-3 text-cyan-300">Bairro</th>';
    html += '<th class="text-left p-3 text-cyan-300">Ocorrências</th>';
    html += '<th class="text-left p-3 text-cyan-300">Coordenadas</th>';
    html += '</tr></thead><tbody>';
    
    data.slice(0, 50).forEach(item => {
      html += '<tr class="border-b border-slate-800 hover:bg-slate-800/50">';
      html += `<td class="p-3">${item.bairro || 'Não informado'}</td>`;
      html += `<td class="p-3">${item.count}</td>`;
      html += `<td class="p-3 text-xs text-slate-400">${item.latitude}, ${item.longitude}</td>`;
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    html += `<p class="mt-4 text-slate-400 text-sm">Mostrando ${Math.min(data.length, 50)} de ${data.length} bairros</p>`;
    
    content.innerHTML = html;
  } catch (error) {
    window.Logger?.error('Erro ao carregar Geográfica Zeladoria:', error);
  }
}

window.loadZeladoriaGeografica = loadZeladoriaGeografica;

