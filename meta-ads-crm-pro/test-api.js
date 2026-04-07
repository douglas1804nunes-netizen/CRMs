#!/usr/bin/env node

/**
 * Test Script - Validar Endpoints Meta API
 * Uso: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/meta';

async function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando testes da API Meta...\n');

  const tests = [
    {
      name: 'Config Status',
      method: 'GET',
      path: '/config-status',
      validator: (res) => res.data.configured === true
    },
    {
      name: 'Sync Campaigns',
      method: 'POST',
      path: '/sync/campaigns',
      validator: (res) => res.data.ok === true && res.data.synced > 0
    },
    {
      name: 'Get Campaigns',
      method: 'GET',
      path: '/campaigns',
      validator: (res) => Array.isArray(res.data.items)
    },
    {
      name: 'Sync Leads',
      method: 'POST',
      path: '/sync/leads',
      validator: (res) => res.data.ok === true && res.data.synced > 0
    },
    {
      name: 'Get Leads',
      method: 'GET',
      path: '/leads',
      validator: (res) => Array.isArray(res.data.items)
    },
    {
      name: 'Get Dashboard',
      method: 'GET',
      path: '/dashboard',
      validator: (res) => res.data.dashboard && res.data.campaigns && res.data.leads
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name} (${test.method} ${test.path})`);
      const result = await makeRequest(test.method, test.path);
      
      if (test.validator(result)) {
        console.log(`  ✅ PASSOU\n`);
        passed++;
      } else {
        console.log(`  ❌ FALHOU - Validador retornou false\n`);
        console.log(`     Resposta:`, JSON.stringify(result.data).substring(0, 100));
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERRO - ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Resultados:`);
  console.log(`  ✅ Testes Passados: ${passed}`);
  console.log(`  ❌ Testes Falhados: ${failed}`);
  console.log(`  📈 Taxa de Sucesso: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log(`\n🎉 Todos os testes passaram! Dashboard está pronto.`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Alguns testes falharam. Verifique os logs.`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});
