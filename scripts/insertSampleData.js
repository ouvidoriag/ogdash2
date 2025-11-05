import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dados das unidades baseados nas informações fornecidas
const unidades = {
  'ADÃO': {
    assuntos: [
      { assunto: 'Equipe de enfermagem', quantidade: 354 },
      { assunto: 'Atendimento', quantidade: 320 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 205 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 187 },
      { assunto: 'Informação e Orientação Pública', quantidade: 162 },
      { assunto: 'Equipe médica', quantidade: 119 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 110 },
      { assunto: 'Tempo de espera para exames', quantidade: 87 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 50 },
      { assunto: 'Equipe administrativa', quantidade: 47 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 23 },
      { assunto: 'Internação e transferência hospitalar', quantidade: 21 },
      { assunto: 'Funcionário', quantidade: 15 },
      { assunto: 'Demora no resultado de exames', quantidade: 15 },
      { assunto: 'Atendimento de urgência e emergência', quantidade: 14 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 12 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 12 },
      { assunto: 'Falta de profissionais', quantidade: 11 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 1405 },
      { tipo: 'Reclamação', quantidade: 590 },
      { tipo: 'Sugestão', quantidade: 388 },
      { tipo: 'Denúncia', quantidade: 22 },
      { tipo: 'E-sic', quantidade: 4 }
    ]
  },
  'CER IV': {
    assuntos: [
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 153 },
      { assunto: 'Marcação de consulta', quantidade: 62 },
      { assunto: 'Informação e Orientação Pública', quantidade: 56 },
      { assunto: 'Equipe administrativa', quantidade: 42 },
      { assunto: 'Equipe médica', quantidade: 35 },
      { assunto: 'Atendimento', quantidade: 29 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 25 },
      { assunto: 'Equipe de enfermagem', quantidade: 10 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 8 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 6 },
      { assunto: 'Fiscalização de medicamentos e produtos', quantidade: 4 },
      { assunto: 'Criação de unidade de saúde', quantidade: 4 },
      { assunto: 'Tempo de espera para exames', quantidade: 3 },
      { assunto: 'Marcação de Exame', quantidade: 3 },
      { assunto: 'Internação e transferência hospitalar', quantidade: 2 },
      { assunto: 'Limpeza urbana e retirada de entulho', quantidade: 1 },
      { assunto: 'Informação e transferência hospitalar', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 214 },
      { tipo: 'Reclamação', quantidade: 170 },
      { tipo: 'Sugestão', quantidade: 56 },
      { tipo: 'Denúncia', quantidade: 13 }
    ]
  },
  'Hospital do Olho': {
    assuntos: [
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 182 },
      { assunto: 'Atendimento', quantidade: 62 },
      { assunto: 'Informação e Orientação Pública', quantidade: 30 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 26 },
      { assunto: 'Equipe administrativa', quantidade: 21 },
      { assunto: 'Tempo de espera para exames', quantidade: 20 },
      { assunto: 'Equipe médica', quantidade: 19 },
      { assunto: 'Equipe de enfermagem', quantidade: 17 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 12 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 9 },
      { assunto: 'Marcação de consulta', quantidade: 8 },
      { assunto: 'Internação e transferência hospitalar', quantidade: 6 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 5 },
      { assunto: 'Tempo de espera para cirurgia', quantidade: 4 },
      { assunto: 'Tempo de atendimento com o psicólogo', quantidade: 3 },
      { assunto: 'Demora na entrega das lentes', quantidade: 2 },
      { assunto: 'Atendimento à saúde mental', quantidade: 2 },
      { assunto: 'Falta de comunicação', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 276 },
      { tipo: 'Elogio', quantidade: 126 },
      { tipo: 'Sugestão', quantidade: 26 },
      { tipo: 'Denúncia', quantidade: 10 },
      { tipo: 'E-sic', quantidade: 2 }
    ]
  },
  'Hospital Duque': {
    assuntos: [
      { assunto: 'Marcação de consulta', quantidade: 334 },
      { assunto: 'Atendimento', quantidade: 150 },
      { assunto: 'Tempo de espera para exames', quantidade: 86 },
      { assunto: 'Equipe médica', quantidade: 79 },
      { assunto: 'Informação e Orientação Pública', quantidade: 60 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 40 },
      { assunto: 'Marcação de Exame', quantidade: 32 },
      { assunto: 'Funcionário', quantidade: 22 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 18 },
      { assunto: 'Equipe administrativa', quantidade: 16 },
      { assunto: 'Marcação de cirurgia', quantidade: 16 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 15 },
      { assunto: 'Marcação de exame', quantidade: 13 },
      { assunto: 'Equipe de enfermagem', quantidade: 12 },
      { assunto: 'Tempo de espera para cirurgia', quantidade: 8 },
      { assunto: 'Demora no resultado de exames', quantidade: 7 },
      { assunto: 'Falta de exames na unidade', quantidade: 6 },
      { assunto: 'Outros', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 683 },
      { tipo: 'Elogio', quantidade: 170 },
      { tipo: 'Sugestão', quantidade: 42 },
      { tipo: 'Denúncia', quantidade: 20 },
      { tipo: 'E-sic', quantidade: 7 }
    ]
  },
  'Hospital Infantil': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 250 },
      { assunto: 'Marcação de consulta', quantidade: 122 },
      { assunto: 'Equipe médica', quantidade: 116 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 60 },
      { assunto: 'Tempo de espera para exames', quantidade: 37 },
      { assunto: 'Marcação de cirurgia', quantidade: 33 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 31 },
      { assunto: 'Marcação de Exame', quantidade: 28 },
      { assunto: 'Equipe administrativa', quantidade: 25 },
      { assunto: 'Funcionário', quantidade: 21 },
      { assunto: 'Equipe de enfermagem', quantidade: 18 },
      { assunto: 'Informação e Orientação Pública', quantidade: 14 },
      { assunto: 'Tempo de espera para exames', quantidade: 11 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 8 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 7 },
      { assunto: 'Internação e transferência hospitalar', quantidade: 6 },
      { assunto: 'Tempo de espera por consulta', quantidade: 1 },
      { assunto: 'Outros', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 467 },
      { tipo: 'Elogio', quantidade: 325 },
      { tipo: 'Sugestão', quantidade: 25 },
      { tipo: 'Denúncia', quantidade: 14 },
      { tipo: 'E-sic', quantidade: 3 }
    ]
  },
  'Hospital Moacyr': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 106 },
      { assunto: 'Tempo de espera para exames', quantidade: 38 },
      { assunto: 'Demora no resultado de exames', quantidade: 25 },
      { assunto: 'Equipe de enfermagem', quantidade: 23 },
      { assunto: 'Equipe médica', quantidade: 19 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 16 },
      { assunto: 'Equipe administrativa', quantidade: 10 },
      { assunto: 'Outros', quantidade: 9 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 8 },
      { assunto: 'Atendimento à saúde mental', quantidade: 6 },
      { assunto: 'Funcionário', quantidade: 6 },
      { assunto: 'Acessibilidade em unidades de saúde', quantidade: 5 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 5 },
      { assunto: 'Demora na entrega das lentes', quantidade: 3 },
      { assunto: 'Informação e transferência hospitalar', quantidade: 3 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 3 },
      { assunto: 'Fila de espera para procedimentos', quantidade: 1 },
      { assunto: 'Outros', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 179 },
      { tipo: 'Elogio', quantidade: 128 },
      { tipo: 'Sugestão', quantidade: 10 },
      { tipo: 'Denúncia', quantidade: 5 }
    ]
  },
  'Maternidade Santa Cruz': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 115 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 38 },
      { assunto: 'Equipe de enfermagem', quantidade: 32 },
      { assunto: 'Equipe administrativa', quantidade: 20 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 15 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 15 },
      { assunto: 'Funcionário', quantidade: 12 },
      { assunto: 'Equipe médica', quantidade: 8 },
      { assunto: 'Assédio', quantidade: 7 },
      { assunto: 'Campanhas de prevenção e conscientização', quantidade: 1 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 1 },
      { assunto: 'Atendimento de urgência e emergência', quantidade: 1 },
      { assunto: 'Marcação de Exame', quantidade: 1 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 1 },
      { assunto: 'Informação e Orientação Pública', quantidade: 1 },
      { assunto: 'Marcação de cirurgia', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 194 },
      { tipo: 'Reclamação', quantidade: 48 },
      { tipo: 'Denúncia', quantidade: 22 },
      { tipo: 'Sugestão', quantidade: 5 }
    ]
  },
  'UPA Beira Mar': {
    assuntos: [
      { assunto: 'Equipe administrativa', quantidade: 149 },
      { assunto: 'Equipe médica', quantidade: 125 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 114 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 105 },
      { assunto: 'Equipe de enfermagem', quantidade: 101 },
      { assunto: 'Tempo de espera para exames', quantidade: 55 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 30 },
      { assunto: 'Atendimento', quantidade: 23 },
      { assunto: 'Internação e transferência hospitalar', quantidade: 14 },
      { assunto: 'Informação e Orientação Pública', quantidade: 11 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 10 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 7 },
      { assunto: 'Marcação de consulta', quantidade: 6 },
      { assunto: 'Informação e orientação pública', quantidade: 5 },
      { assunto: 'Assédio', quantidade: 4 },
      { assunto: 'Falta de comunicação', quantidade: 4 },
      { assunto: 'Demora no resultado de exames', quantidade: 4 },
      { assunto: 'Atendimentos odontológicos', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 379 },
      { tipo: 'Reclamação', quantidade: 375 },
      { tipo: 'Sugestão', quantidade: 14 },
      { tipo: 'E-sic', quantidade: 11 },
      { tipo: 'Denúncia', quantidade: 8 }
    ]
  },
  'UPH Pilar': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 244 },
      { assunto: 'Equipe médica', quantidade: 77 },
      { assunto: 'Marcação de consulta', quantidade: 54 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 52 },
      { assunto: 'Funcionário', quantidade: 31 },
      { assunto: 'Equipe de enfermagem', quantidade: 27 },
      { assunto: 'Informação e Orientação Pública', quantidade: 22 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 15 },
      { assunto: 'Outros', quantidade: 12 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 12 },
      { assunto: 'Assédio', quantidade: 11 },
      { assunto: 'Equipe administrativa', quantidade: 8 },
      { assunto: 'Marcação de cirurgia', quantidade: 8 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 6 },
      { assunto: 'Informação e Orientação Pública', quantidade: 4 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 4 },
      { assunto: 'Falta de comunicação', quantidade: 3 },
      { assunto: 'Falta de materiais na unidade', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 304 },
      { tipo: 'Reclamação', quantidade: 283 },
      { tipo: 'Denúncia', quantidade: 16 },
      { tipo: 'Sugestão', quantidade: 14 }
    ]
  },
  'UPH Saracuruna': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 150 },
      { assunto: 'Equipe médica', quantidade: 72 },
      { assunto: 'Equipe administrativa', quantidade: 46 },
      { assunto: 'Funcionário', quantidade: 35 },
      { assunto: 'Equipe de enfermagem', quantidade: 34 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 29 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 18 },
      { assunto: 'Atendimento à saúde mental', quantidade: 15 },
      { assunto: 'Falta de comunicação', quantidade: 13 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 13 },
      { assunto: 'Marcação de consulta', quantidade: 13 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 10 },
      { assunto: 'Outros', quantidade: 8 },
      { assunto: 'Informação e Orientação Pública', quantidade: 3 },
      { assunto: 'Falta de pagamento', quantidade: 2 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 2 },
      { assunto: 'Marcação de Exame', quantidade: 1 },
      { assunto: 'Demora no resultado de exames', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 294 },
      { tipo: 'Reclamação', quantidade: 158 },
      { tipo: 'Sugestão', quantidade: 13 },
      { tipo: 'Denúncia', quantidade: 2 }
    ]
  },
  'UPH Xerém': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 150 },
      { assunto: 'Equipe de enfermagem', quantidade: 59 },
      { assunto: 'Equipe médica', quantidade: 42 },
      { assunto: 'Marcação de consulta', quantidade: 37 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 24 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 18 },
      { assunto: 'Informação e Orientação Pública', quantidade: 11 },
      { assunto: 'Informação e Orientação Pública', quantidade: 10 },
      { assunto: 'Equipe administrativa', quantidade: 9 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 5 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 4 },
      { assunto: 'Falta de pagamento', quantidade: 3 },
      { assunto: 'Funcionário', quantidade: 3 },
      { assunto: 'Falta de médicos especialistas', quantidade: 3 },
      { assunto: 'Outros', quantidade: 3 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 1 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 1 },
      { assunto: 'Atendimento à saúde mental', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 189 },
      { tipo: 'Reclamação', quantidade: 142 },
      { tipo: 'Sugestão', quantidade: 31 },
      { tipo: 'E-sic', quantidade: 14 },
      { tipo: 'Denúncia', quantidade: 14 }
    ]
  },
  'Hospital Veterinário': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 29 },
      { assunto: 'Funcionário', quantidade: 12 },
      { assunto: 'Equipe médica', quantidade: 9 },
      { assunto: 'Outros', quantidade: 3 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 2 },
      { assunto: 'Falta de profissionais', quantidade: 1 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 1 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 1 },
      { assunto: 'Vacinação', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 },
      { assunto: 'Tempo de espera para cirurgia', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 39 },
      { tipo: 'Reclamação', quantidade: 18 },
      { tipo: 'Sugestão', quantidade: 2 },
      { tipo: 'Denúncia', quantidade: 2 }
    ]
  },
  'UPA Walter Garcia': {
    assuntos: [
      { assunto: 'Equipe médica', quantidade: 19 },
      { assunto: 'Atendimento', quantidade: 14 },
      { assunto: 'Equipe de enfermagem', quantidade: 11 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 4 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 4 },
      { assunto: 'Funcionário', quantidade: 3 },
      { assunto: 'Tempo de espera para exames', quantidade: 3 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 2 },
      { assunto: 'Outros', quantidade: 2 },
      { assunto: 'Internação e transferência hospitalar', quantidade: 1 },
      { assunto: 'Atendimento de urgência e emergência', quantidade: 1 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 1 },
      { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 1 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 38 },
      { tipo: 'Elogio', quantidade: 21 },
      { tipo: 'Denúncia', quantidade: 9 }
    ]
  },
  'UPH Campos Elíseos': {
    assuntos: [
      { assunto: 'Equipe médica', quantidade: 8 },
      { assunto: 'Atendimento', quantidade: 7 },
      { assunto: 'Outros', quantidade: 5 },
      { assunto: 'Equipe de enfermagem', quantidade: 3 },
      { assunto: 'Tempo de espera para exames', quantidade: 2 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 2 },
      { assunto: 'Demora no resultado de exames', quantidade: 1 },
      { assunto: 'Funcionário', quantidade: 1 },
      { assunto: 'Direitos e programas sociais', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 17 },
      { tipo: 'Elogio', quantidade: 15 },
      { tipo: 'Denúncia', quantidade: 2 }
    ]
  },
  'UPH Parque Equitativa': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 17 },
      { assunto: 'Marcação de consulta', quantidade: 7 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 4 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 3 },
      { assunto: 'Equipe de enfermagem', quantidade: 3 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 2 },
      { assunto: 'Informação e Orientação Pública', quantidade: 2 },
      { assunto: 'Equipe médica', quantidade: 2 },
      { assunto: 'Falta de comunicação', quantidade: 1 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 1 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 1 },
      { assunto: 'Prontuário médico', quantidade: 1 },
      { assunto: 'Fiscalização de estabelecimentos comerciais', quantidade: 1 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 23 },
      { tipo: 'Elogio', quantidade: 19 },
      { tipo: 'Denúncia', quantidade: 4 }
    ]
  },
  'UBS Antonio Granja': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 11 },
      { assunto: 'Funcionário', quantidade: 3 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 3 },
      { assunto: 'Marcação de consulta', quantidade: 3 },
      { assunto: 'Equipe médica', quantidade: 2 },
      { assunto: 'Vacinação', quantidade: 1 },
      { assunto: 'Abuso de Autoridade', quantidade: 1 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 1 },
      { assunto: 'Atendimento odontológico', quantidade: 1 },
      { assunto: 'Demora no resultado de exames', quantidade: 1 },
      { assunto: 'Informação e Orientação Pública', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 17 },
      { tipo: 'Elogio', quantidade: 9 },
      { tipo: 'Denúncia', quantidade: 4 },
      { tipo: 'Sugestão', quantidade: 1 }
    ]
  },
  'UPA Sarapuí': {
    assuntos: [
      { assunto: 'Equipe médica', quantidade: 4 },
      { assunto: 'Equipe de enfermagem', quantidade: 3 },
      { assunto: 'Atendimento', quantidade: 3 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 },
      { assunto: 'Marcação de consulta', quantidade: 1 },
      { assunto: 'Atendimento à saúde mental', quantidade: 1 },
      { assunto: 'Atendimento à saúde mental (emergência)', quantidade: 1 },
      { assunto: 'Tempo de espera para exames', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 9 },
      { tipo: 'Denúncia', quantidade: 4 },
      { tipo: 'Reclamação', quantidade: 3 }
    ]
  },
  'UPH Imbariê': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 7 },
      { assunto: 'Marcação de consulta', quantidade: 2 },
      { assunto: 'Equipe de enfermagem', quantidade: 1 },
      { assunto: 'Equipe médica', quantidade: 1 },
      { assunto: 'Demora no resultado de exames', quantidade: 1 },
      { assunto: 'Fiscalização de medicamentos e produtos', quantidade: 1 },
      { assunto: 'Funcionário', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 8 },
      { tipo: 'Reclamação', quantidade: 6 }
    ]
  },
  'UPH Parque Equitativa': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 17 },
      { assunto: 'Marcação de consulta', quantidade: 7 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 4 },
      { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 3 },
      { assunto: 'Equipe de enfermagem', quantidade: 3 },
      { assunto: 'Tempo de espera para atendimento', quantidade: 2 },
      { assunto: 'Informação e Orientação Pública', quantidade: 2 },
      { assunto: 'Equipe médica', quantidade: 2 },
      { assunto: 'Falta de comunicação', quantidade: 1 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 1 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 1 },
      { assunto: 'Prontuário médico', quantidade: 1 },
      { assunto: 'Fiscalização de estabelecimentos comerciais', quantidade: 1 },
      { assunto: 'Falta de medicamentos e insumos', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 23 },
      { tipo: 'Elogio', quantidade: 19 },
      { tipo: 'Denúncia', quantidade: 4 }
    ]
  },
  'UBS Antonio Granja': {
    assuntos: [
      { assunto: 'Atendimento', quantidade: 11 },
      { assunto: 'Funcionário', quantidade: 3 },
      { assunto: 'Conduta irregular de funcionário', quantidade: 3 },
      { assunto: 'Marcação de consulta', quantidade: 3 },
      { assunto: 'Equipe médica', quantidade: 2 },
      { assunto: 'Vacinação', quantidade: 1 },
      { assunto: 'Abuso de Autoridade', quantidade: 1 },
      { assunto: 'Maus tratos aos pacientes', quantidade: 1 },
      { assunto: 'Atendimento odontológico', quantidade: 1 },
      { assunto: 'Demora no resultado de exames', quantidade: 1 },
      { assunto: 'Informação e Orientação Pública', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Reclamação', quantidade: 17 },
      { tipo: 'Elogio', quantidade: 9 },
      { tipo: 'Denúncia', quantidade: 4 },
      { tipo: 'Sugestão', quantidade: 1 }
    ]
  },
  'UPA Sarapuí': {
    assuntos: [
      { assunto: 'Equipe médica', quantidade: 4 },
      { assunto: 'Equipe de enfermagem', quantidade: 3 },
      { assunto: 'Atendimento', quantidade: 3 },
      { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 1 },
      { assunto: 'Equipe administrativa', quantidade: 1 },
      { assunto: 'Marcação de consulta', quantidade: 1 },
      { assunto: 'Atendimento à saúde mental', quantidade: 1 },
      { assunto: 'Atendimento à saúde mental (emergência)', quantidade: 1 },
      { assunto: 'Tempo de espera para exames', quantidade: 1 }
    ],
    tipos: [
      { tipo: 'Elogio', quantidade: 9 },
      { tipo: 'Denúncia', quantidade: 4 },
      { tipo: 'Reclamação', quantidade: 3 }
    ]
  }
};

// Dados de Reclamações e Denúncias (geral)
const reclamacoesDenuncias = {
  assuntos: [
    { assunto: 'Marcação de consulta', quantidade: 897 },
    { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 571 },
    { assunto: 'Atendimento', quantidade: 533 },
    { assunto: 'Equipe médica', quantidade: 418 },
    { assunto: 'Tempo de espera para exames', quantidade: 310 },
    { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 310 },
    { assunto: 'Poluição Ambiental (Ar, Solo, Água e Som)', quantidade: 280 },
    { assunto: 'Informação e Orientação Pública', quantidade: 266 },
    { assunto: 'Equipe multidisciplinar (psicologo, terapeuta, fisioterapeuta, etc.)', quantidade: 187 },
    { assunto: 'Tempo de espera para atendimento', quantidade: 178 },
    { assunto: 'Equipe de enfermagem', quantidade: 170 },
    { assunto: 'Limpeza urbana e retirada de entulho', quantidade: 141 },
    { assunto: 'Equipe administrativa', quantidade: 104 },
    { assunto: 'Marcação de Exame', quantidade: 103 },
    { assunto: 'Funcionário', quantidade: 103 },
    { assunto: 'Conduta irregular de funcionário', quantidade: 98 }
  ]
};

// Dados de Unidades SUAC (Sem UAC)
const unidadesSUAC = {
  assuntos: [
    { assunto: 'Informação e Orientação Pública', quantidade: 2938 },
    { assunto: 'Atendimento', quantidade: 557 },
    { assunto: 'Marcação de consulta', quantidade: 327 },
    { assunto: 'Poluição Ambiental (Ar, Solo, Água e Som)', quantidade: 284 },
    { assunto: 'Demora, grosseria ou falta de atendimento', quantidade: 154 },
    { assunto: 'Limpeza urbana e retirada de entulho', quantidade: 153 },
    { assunto: 'Equipe médica', quantidade: 147 },
    { assunto: 'Funcionário', quantidade: 144 },
    { assunto: 'Estrutura, limpeza e materiais da unidade', quantidade: 113 },
    { assunto: 'Asfaltamento e pavimentação', quantidade: 92 },
    { assunto: 'Buracos, nós, valões e redes de esgoto', quantidade: 82 },
    { assunto: 'Equipe de enfermagem', quantidade: 73 },
    { assunto: 'Conduta irregular de funcionário', quantidade: 63 },
    { assunto: 'Poda e remoção de árvore', quantidade: 60 },
    { assunto: 'Equipe administrativa', quantidade: 57 },
    { assunto: 'Assédio', quantidade: 52 },
    { assunto: 'Tempo de espera para atendimento', quantidade: 48 },
    { assunto: 'Problemas multi/inter-disciplinares', quantidade: 1 }
  ],
  tipos: [
    { tipo: 'Elogio', quantidade: 2770 },
    { tipo: 'Reclamação', quantidade: 2586 },
    { tipo: 'Sugestão', quantidade: 601 },
    { tipo: 'E-sic', quantidade: 170 }
  ]
};

async function main() {
  const totalAtual = await prisma.record.count();
  console.log(`📊 Registros atuais no banco: ${totalAtual}`);
  
  if (totalAtual === 0) {
    console.log('📝 Banco vazio, inserindo todos os dados...');
  } else {
    console.log('🔄 Banco já possui dados, atualizando/inserindo apenas novos registros...');
    console.log('💡 Para recriar tudo do zero, delete o banco manualmente primeiro');
  }
  
  let totalRecords = 0;
  let inseridos = 0;
  let atualizados = 0;
  
  // Inserir dados de cada unidade
  for (const [unidadeNome, dados] of Object.entries(unidades)) {
    console.log(`\n📊 Inserindo dados de ${unidadeNome}...`);
    
    for (const assuntoData of dados.assuntos) {
      for (let i = 0; i < assuntoData.quantidade; i++) {
        // Escolher tipo aleatório baseado nas quantidades
        const tipos = dados.tipos;
        let tipoEscolhido = 'Reclamação'; // padrão
        const rand = Math.random() * tipos.reduce((sum, t) => sum + t.quantidade, 0);
        let acumulado = 0;
        for (const tipo of tipos) {
          acumulado += tipo.quantidade;
          if (rand <= acumulado) {
            tipoEscolhido = tipo.tipo;
            break;
          }
        }
        
        const dataObj = {
          'UAC': `UAC - ${unidadeNome}`,
          'Unidade de Atendimento': unidadeNome,
          'Assunto': assuntoData.assunto,
          'Tipo': tipoEscolhido,
          'Tipo Manifestação': tipoEscolhido,
          'Categoria': assuntoData.assunto,
          'Data': new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR'),
          'Status': Math.random() > 0.3 ? 'Concluída' : 'Em atendimento'
        };
        
        const dataIsoValue = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
        const dataConclusaoIsoValue = Math.random() > 0.3 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : null;
        
        const data = {
          data: JSON.stringify(dataObj),
          uac: `UAC - ${unidadeNome}`,
          responsavel: unidadeNome,
          assunto: assuntoData.assunto,
          tipo: tipoEscolhido,
          categoria: assuntoData.assunto,
          tema: assuntoData.assunto.includes('Equipe') ? 'Saúde' : assuntoData.assunto.includes('Marcação') ? 'Saúde' : 'Outros',
          status: Math.random() > 0.3 ? 'Concluída' : 'Em atendimento',
          dataIso: dataIsoValue,
          dataConclusaoIso: dataConclusaoIsoValue
        };
        
        // Verificar se já existe (por assunto + unidade + tipo)
        const existente = await prisma.record.findFirst({
          where: {
            assunto: data.assunto,
            responsavel: data.responsavel,
            tipo: data.tipo,
            uac: data.uac
          }
        });
        
        if (!existente) {
          await prisma.record.create({ data });
          inseridos++;
        } else {
          await prisma.record.update({
            where: { id: existente.id },
            data: data
          });
          atualizados++;
        }
        totalRecords++;
      }
    }
    
    console.log(`✅ ${dados.assuntos.reduce((sum, a) => sum + a.quantidade, 0)} registros inseridos para ${unidadeNome}`);
  }
  
  // Inserir dados de Unidades SUAC
  console.log('\n📝 Inserindo dados de Unidades SUAC...');
  for (const assuntoData of unidadesSUAC.assuntos) {
    for (let i = 0; i < assuntoData.quantidade; i++) {
      // Escolher tipo aleatório baseado nas quantidades
      const tipos = unidadesSUAC.tipos;
      let tipoEscolhido = 'Reclamação'; // padrão
      const rand = Math.random() * tipos.reduce((sum, t) => sum + t.quantidade, 0);
      let acumulado = 0;
      for (const tipo of tipos) {
        acumulado += tipo.quantidade;
        if (rand <= acumulado) {
          tipoEscolhido = tipo.tipo;
          break;
        }
      }
      
      const dataObj = {
        'Assunto': assuntoData.assunto,
        'Tipo': tipoEscolhido,
        'Tipo Manifestação': tipoEscolhido,
        'Categoria': assuntoData.assunto,
        'Data': new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR'),
        'Status': Math.random() > 0.3 ? 'Concluída' : 'Em atendimento'
      };
      
      const dataIsoValue = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
      const dataConclusaoIsoValue = Math.random() > 0.3 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : null;
      
      const data = {
        data: JSON.stringify(dataObj),
        assunto: assuntoData.assunto,
        tipo: tipoEscolhido,
        categoria: assuntoData.assunto,
        tema: assuntoData.assunto.includes('Equipe') ? 'Saúde' : assuntoData.assunto.includes('Marcação') ? 'Saúde' : 'Outros',
        status: Math.random() > 0.3 ? 'Concluída' : 'Em atendimento',
        dataIso: dataIsoValue,
        dataConclusaoIso: dataConclusaoIsoValue
      };
      
      // Verificar se já existe
      const existente = await prisma.record.findFirst({
        where: {
          assunto: data.assunto,
          tipo: data.tipo,
          uac: null,
          responsavel: null
        }
      });
      
      if (!existente) {
        await prisma.record.create({ data });
        inseridos++;
      } else {
        await prisma.record.update({
          where: { id: existente.id },
          data: data
        });
        atualizados++;
      }
      totalRecords++;
    }
  }
  console.log(`✅ ${unidadesSUAC.assuntos.reduce((sum, a) => sum + a.quantidade, 0)} registros processados para Unidades SUAC`);
  
  // Inserir dados de Reclamações e Denúncias (geral)
  console.log('\n📝 Inserindo dados de Reclamações e Denúncias...');
  for (const assuntoData of reclamacoesDenuncias.assuntos) {
    for (let i = 0; i < assuntoData.quantidade; i++) {
      const tipo = Math.random() > 0.5 ? 'Reclamação' : 'Denúncia';
      const dataObj = {
        'Assunto': assuntoData.assunto,
        'Tipo': tipo,
        'Tipo Manifestação': tipo,
        'Categoria': assuntoData.assunto,
        'Data': new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('pt-BR'),
        'Status': Math.random() > 0.3 ? 'Concluída' : 'Em atendimento'
      };
      
      const dataIsoValue = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
      const dataConclusaoIsoValue = Math.random() > 0.3 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : null;
      
      const data = {
        data: JSON.stringify(dataObj),
        assunto: assuntoData.assunto,
        tipo: tipo,
        categoria: assuntoData.assunto,
        tema: assuntoData.assunto.includes('Equipe') ? 'Saúde' : assuntoData.assunto.includes('Marcação') ? 'Saúde' : 'Outros',
        status: Math.random() > 0.3 ? 'Concluída' : 'Em atendimento',
        dataIso: dataIsoValue,
        dataConclusaoIso: dataConclusaoIsoValue
      };
      
      // Verificar se já existe
      const existente = await prisma.record.findFirst({
        where: {
          assunto: data.assunto,
          tipo: data.tipo,
          uac: null,
          responsavel: null
        }
      });
      
      if (!existente) {
        await prisma.record.create({ data });
        inseridos++;
      } else {
        await prisma.record.update({
          where: { id: existente.id },
          data: data
        });
        atualizados++;
      }
      totalRecords++;
    }
  }
  
  const totalFinal = await prisma.record.count();
  console.log(`\n✅ Processamento concluído!`);
  console.log(`📊 Total processado: ${totalRecords}`);
  console.log(`➕ Novos registros inseridos: ${inseridos}`);
  console.log(`🔄 Registros atualizados: ${atualizados}`);
  console.log(`📈 Total final no banco: ${totalFinal}`);
  console.log('🎉 Dados atualizados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

