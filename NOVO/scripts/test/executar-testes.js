#!/usr/bin/env node
/**
 * Script para Executar Todos os Testes
 * 
 * Valida estrutura e prepara ambiente para testes no navegador
 * 
 * CÉREBRO X-3
 * Data: 18/12/2025
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');

console.log('🧪 EXECUTANDO TODOS OS TESTES DO SISTEMA CROSSFILTER\n');
console.log('='.repeat(70));

// Executar validação de estrutura
async function runValidation() {
  try {
    const { stdout, stderr } = await execAsync('node scripts/test/validate-crossfilter.js', {
      cwd: projectRoot
    });
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Erro ao executar validação:', error.message);
  }
}

// Executar validação de testes
async function runTestValidation() {
  try {
    const { stdout, stderr } = await execAsync('node scripts/test/validate-test-execution.js', {
      cwd: projectRoot
    });
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Erro ao validar testes:', error.message);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('\n📋 Executando validação de estrutura...\n');
  await runValidation();
  
  console.log('\n📋 Executando validação de testes...\n');
  await runTestValidation();
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ VALIDAÇÕES CONCLUÍDAS\n');
  console.log('📋 Para executar testes no navegador:');
  console.log('   1. Abra http://localhost:3000');
  console.log('   2. Pressione F12 para abrir o console');
  console.log('   3. Execute: testCrossfilterComplete.run()');
  console.log('='.repeat(70));
}

runAllTests().catch(console.error);

