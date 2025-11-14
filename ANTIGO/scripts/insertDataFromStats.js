import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Distribuição por mês
const meses = [
  { mes: '2025-01', quantidade: 506 },
  { mes: '2025-02', quantidade: 963 },
  { mes: '2025-03', quantidade: 1283 },
  { mes: '2025-04', quantidade: 1617 },
  { mes: '2025-05', quantidade: 2144 },
  { mes: '2025-06', quantidade: 1121 },
  { mes: '2025-07', quantidade: 1442 },
  { mes: '2025-08', quantidade: 1552 },
  { mes: '2025-09', quantidade: 1925 },
  { mes: '2025-10', quantidade: 2179 },
  { mes: '2025-11', quantidade: 63 }
];

// Temas
const temas = [
  { tema: 'Saúde', quantidade: 10202 },
  { tema: 'Comunicação Social', quantidade: 1479 },
  { tema: 'Obras, Limpeza Urbana e Braço de Luz', quantidade: 631 },
  { tema: 'Meio Ambiente', quantidade: 443 },
  { tema: 'Segurança, Sinalização e Multas', quantidade: 411 },
  { tema: 'Fiscalização e Tributos', quantidade: 387 },
  { tema: 'Fiscalização Urbana, Regularização e Registro de Imóveis', quantidade: 210 },
  { tema: 'Educação', quantidade: 170 },
  { tema: 'Assuntos Jurídicos', quantidade: 146 },
  { tema: 'Direitos e Vantagens do Servidor', quantidade: 128 },
  { tema: 'Assistência Social e Direitos Humanos', quantidade: 97 },
  { tema: 'Transportes, Serviços Públicos e Troca de Lâmpadas', quantidade: 77 },
  { tema: 'Assédio', quantidade: 53 },
  { tema: 'Obras Públicas', quantidade: 48 },
  { tema: 'Governo Municipal e Enterro Gratuito', quantidade: 41 },
  { tema: 'Proteção Animal', quantidade: 34 },
  { tema: 'Vetores e Zoonoses (Combate à Dengue, Controle de Pragas etc.)', quantidade: 31 },
  { tema: 'Segurança Pública', quantidade: 29 }
];

// Canais
const canais = [
  { canal: 'Presencial', quantidade: 2678 },
  { canal: 'Busca Ativa', quantidade: 2332 },
  { canal: 'Telefone', quantidade: 1748 },
  { canal: 'E-mail', quantidade: 1739 },
  { canal: 'UMA', quantidade: 1307 },
  { canal: 'Aplicativo Colab', quantidade: 389 },
  { canal: 'Fala.BR', quantidade: 107 },
  { canal: 'Ouvidoria SUS', quantidade: 58 }
];

// Assuntos principais
const assuntos = [
  { assunto: 'Informação e Orientação Pública', quantidade: 3255 },
  { assunto: 'Atendimento', quantidade: 2183 },
  { assunto: 'Equipe de Enfermagem', quantidade: 1362 },
  { assunto: 'Marcação de Consulta', quantidade: 968 },
  { assunto: 'Equipe Médica', quantidade: 865 },
  { assunto: 'Equipe Multidisciplinar (Psicólogo, Terapeuta, Fisioterapeuta etc.)', quantidade: 774 },
  { assunto: 'Demora, Grossaria ou Falta de Atendimento', quantidade: 690 },
  { assunto: 'Equipe Administrativa', quantidade: 449 },
  { assunto: 'Estrutura, Limpeza e Materiais da Unidade', quantidade: 440 },
  { assunto: 'Tempo de Espera para Exames', quantidade: 339 },
  { assunto: 'Funcionário', quantidade: 292 },
  { assunto: 'Poluição Ambiental (Ar, Solo, Água e Som)', quantidade: 284 },
  { assunto: 'Tempo de Espera para Atendimento', quantidade: 203 },
  { assunto: 'Limpeza Urbana e Retirada de Entulho', quantidade: 156 },
  { assunto: 'Marcação de Exame', quantidade: 107 },
  { assunto: 'Conduta Irregular de Funcionário', quantidade: 104 },
  { assunto: 'Marcação de Cirurgia', quantidade: 99 }
];

// Unidades (UAC)
const unidades = [
  { uac: 'UAC - Adão Pereira Nunes', quantidade: 2419 },
  { uac: 'Cidadão', quantidade: 1543 },
  { uac: 'UAC - Hospital Duque', quantidade: 922 },
  { uac: 'UAC - Hospital Infantil', quantidade: 834 },
  { uac: 'UAC - UPA Beira Mar', quantidade: 784 },
  { uac: 'UAC - UPH Pilar', quantidade: 617 },
  { uac: 'UAC - UPH Saracuruna', quantidade: 467 },
  { uac: 'UAC - CER IV', quantidade: 453 },
  { uac: 'UAC - Hospital do Olho', quantidade: 440 },
  { uac: 'UAC - UPH Xerém', quantidade: 390 },
  { uac: 'UAC - Hospital Moacyr', quantidade: 322 },
  { uac: 'UAC - Maternidade Santa Cruz', quantidade: 269 }
];

// Servidores
const servidores = [
  { servidor: 'Cidadão', quantidade: 1543 },
  { servidor: 'Dayane Mendes dos Santos', quantidade: 1213 },
  { servidor: 'Allan Lima dos Santos', quantidade: 1026 },
  { servidor: 'Rildo Luiz Soares', quantidade: 944 },
  { servidor: 'Talita Marques Ferrari', quantidade: 925 },
  { servidor: 'Nikolas Binh Victor da Silva', quantidade: 862 },
  { servidor: 'Stephane Reis dos Santos Silva', quantidade: 805 },
  { servidor: 'Livia Kathleen Cavalcante Patrícia', quantidade: 799 },
  { servidor: 'Lúcia Helena Tinoco Pacheco', quantidade: 780 },
  { servidor: 'Raphael Pereira de Mello', quantidade: 668 }
];

// Tipos de ação
const tiposAcao = [
  { tipo: 'Elogio', quantidade: 5000 },
  { tipo: 'Reclamação', quantidade: 4500 },
  { tipo: 'Sugestão', quantidade: 1000 },
  { tipo: 'Denúncia', quantidade: 200 },
  { tipo: 'E-e', quantidade: 95 }
];

// Responsáveis
const responsaveis = [
  { responsavel: 'Ouvidoria Setorial da Saúde', quantidade: 9824 },
  { responsavel: 'Ouvidoria Geral', quantidade: 4148 },
  { responsavel: 'Ouvidoria Setorial de Meio Ambiente', quantidade: 332 },
  { responsavel: 'Ouvidoria Setorial de Obras', quantidade: 293 },
  { responsavel: 'Ouvidoria Setorial de Segurança Pública', quantidade: 80 },
  { responsavel: 'Cidadão', quantidade: 77 },
  { responsavel: 'Ouvidoria Setorial de Urbanismo', quantidade: 63 },
  { responsavel: 'Ouvidoria Setorial da Assistência Social', quantidade: 55 },
  { responsavel: 'Ouvidoria Setorial de Educação', quantidade: 34 },
  { responsavel: 'Ouvidoria Setorial da Fazenda', quantidade: 29 },
  { responsavel: 'Ouvidoria Setorial da FUNDEC', quantidade: 7 },
  { responsavel: 'Ouvidoria Setorial da Defesa Civil', quantidade: 3 }
];

// Status (72.8% Concluída, 27.2% Em atendimento)
const statusDist = [
  { status: 'Concluída', percentual: 72.8 },
  { status: 'Em atendimento', percentual: 27.2 }
];

// Função para escolher aleatoriamente baseado em distribuição
function escolherPorDistribuicao(distribuicao, total) {
  const rand = Math.random() * total;
  let acumulado = 0;
  for (const item of distribuicao) {
    acumulado += item.quantidade;
    if (rand <= acumulado) {
      return item;
    }
  }
  return distribuicao[distribuicao.length - 1];
}

// Função para gerar data ISO aleatória no mês
function gerarDataIso(mesStr) {
  const [ano, mes] = mesStr.split('-');
  const diasNoMes = new Date(parseInt(ano), parseInt(mes), 0).getDate();
  const dia = Math.floor(Math.random() * diasNoMes) + 1;
  return `${ano}-${mes.padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Função para gerar data de conclusão (se status for Concluída)
function gerarDataConclusao(dataIso, status) {
  if (status === 'Concluída') {
    const data = new Date(dataIso + 'T00:00:00');
    const diasApos = Math.floor(Math.random() * 60) + 1; // 1 a 60 dias depois
    data.setDate(data.getDate() + diasApos);
    return data.toISOString().split('T')[0];
  }
  return null;
}

async function main() {
  console.log('🚀 Iniciando inserção de dados...\n');
  
  const totalEsperado = 14795;
  let inseridos = 0;
  const batchSize = 500;
  
  // Criar arrays expandidos para distribuição
  const registros = [];
  
  for (const mesData of meses) {
    for (let i = 0; i < mesData.quantidade; i++) {
      const dataIso = gerarDataIso(mesData.mes);
      const temaObj = escolherPorDistribuicao(temas, 14795);
      const canalObj = escolherPorDistribuicao(canais, 14795);
      const assuntoObj = escolherPorDistribuicao(assuntos, 14795);
      const unidadeObj = escolherPorDistribuicao(unidades, 14795);
      const servidorObj = escolherPorDistribuicao(servidores, 14795);
      const tipoObj = escolherPorDistribuicao(tiposAcao, 14795);
      const responsavelObj = escolherPorDistribuicao(responsaveis, 14795);
      
      // Status baseado em percentual
      const status = Math.random() < 0.728 ? 'Concluída' : 'Em atendimento';
      const dataConclusaoIso = gerarDataConclusao(dataIso, status);
      
      // Criar objeto JSON para o campo data
      const dataJson = {
        'Data': dataIso.split('-').reverse().join('/'),
        'Data Abertura': dataIso.split('-').reverse().join('/'),
        'Tema': temaObj.tema,
        'Canal': canalObj.canal,
        'Assunto': assuntoObj.assunto,
        'UAC': unidadeObj.uac,
        'Servidor': servidorObj.servidor,
        'Tipo': tipoObj.tipo,
        'Tipo Manifestação': tipoObj.tipo,
        'Status': status,
        'Responsável': responsavelObj.responsavel,
        'Secretaria': responsavelObj.responsavel.includes('Setorial') 
          ? responsavelObj.responsavel.split('Setorial da')[1]?.trim() || responsavelObj.responsavel.split('Setorial de')[1]?.trim() || 'Geral'
          : 'Geral'
      };
      
      registros.push({
        data: JSON.stringify(dataJson),
        dataIso: dataIso,
        dataConclusaoIso: dataConclusaoIso,
        tema: temaObj.tema,
        assunto: assuntoObj.assunto,
        uac: unidadeObj.uac,
        servidor: servidorObj.servidor,
        tipo: tipoObj.tipo,
        status: status,
        responsavel: responsavelObj.responsavel,
        canal: canalObj.canal,
        secretaria: dataJson.Secretaria,
        setor: unidadeObj.uac.replace('UAC - ', ''),
        categoria: assuntoObj.assunto,
        prioridade: Math.random() < 0.3 ? 'Alta' : Math.random() < 0.6 ? 'Média' : 'Baixa'
      });
    }
  }
  
  console.log(`📊 Total de registros gerados: ${registros.length}\n`);
  console.log('💾 Inserindo registros no banco...\n');
  
  // Inserir em lotes
  for (let i = 0; i < registros.length; i += batchSize) {
    const batch = registros.slice(i, i + batchSize);
    await prisma.record.createMany({ data: batch });
    inseridos += batch.length;
    console.log(`   Inseridos: ${inseridos}/${registros.length}`);
  }
  
  const totalFinal = await prisma.record.count();
  console.log(`\n✅ Processo concluído!`);
  console.log(`📈 Total de registros no banco: ${totalFinal}`);
  console.log(`\n💡 Execute 'npm run db:backfill' para normalizar campos adicionais.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

