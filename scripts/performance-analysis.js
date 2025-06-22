#!/usr/bin/env node

/**
 * 🚀 PERFORMANCE ANALYSIS SCRIPT
 * Script para análise automática de performance do bundle e métricas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const DIST_DIR = path.join(__dirname, '../dist');
const ANALYSIS_OUTPUT = path.join(__dirname, '../performance-analysis.json');

// Função para analisar tamanho dos arquivos
function analyzeFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    sizeKB: Math.round(stats.size / 1024 * 100) / 100,
    sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100
  };
}

// Função para analisar bundle
function analyzeBundleSize() {
  const results = {
    timestamp: new Date().toISOString(),
    files: {},
    totals: {
      js: { count: 0, size: 0 },
      css: { count: 0, size: 0 },
      html: { count: 0, size: 0 },
      assets: { count: 0, size: 0 }
    },
    recommendations: []
  };

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found. Run "npm run build" first.');
    return null;
  }

  // Analisar arquivos no diretório dist
  function analyzeDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const relativeFilePath = path.join(relativePath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        analyzeDirectory(filePath, relativeFilePath);
      } else {
        const fileAnalysis = analyzeFileSize(filePath);
        const ext = path.extname(file).toLowerCase();
        
        results.files[relativeFilePath] = {
          ...fileAnalysis,
          type: getFileType(ext)
        };
        
        // Atualizar totais
        const type = getFileType(ext);
        if (results.totals[type]) {
          results.totals[type].count++;
          results.totals[type].size += fileAnalysis.size;
        }
      }
    });
  }

  function getFileType(ext) {
    if (['.js', '.mjs'].includes(ext)) return 'js';
    if (['.css'].includes(ext)) return 'css';
    if (['.html'].includes(ext)) return 'html';
    return 'assets';
  }

  analyzeDirectory(DIST_DIR);

  // Calcular totais em KB/MB
  Object.keys(results.totals).forEach(type => {
    const total = results.totals[type];
    total.sizeKB = Math.round(total.size / 1024 * 100) / 100;
    total.sizeMB = Math.round(total.size / 1024 / 1024 * 100) / 100;
  });

  // Gerar recomendações
  generateRecommendations(results);

  return results;
}

// Função para gerar recomendações
function generateRecommendations(results) {
  const { totals, files } = results;
  
  // Verificar tamanho total do JS
  if (totals.js.sizeKB > 500) {
    results.recommendations.push({
      type: 'warning',
      category: 'bundle-size',
      message: `JavaScript bundle is ${totals.js.sizeKB}KB. Consider code splitting or removing unused dependencies.`,
      impact: 'high'
    });
  } else if (totals.js.sizeKB > 250) {
    results.recommendations.push({
      type: 'info',
      category: 'bundle-size',
      message: `JavaScript bundle is ${totals.js.sizeKB}KB. Monitor for further growth.`,
      impact: 'medium'
    });
  } else {
    results.recommendations.push({
      type: 'success',
      category: 'bundle-size',
      message: `JavaScript bundle size is optimal at ${totals.js.sizeKB}KB.`,
      impact: 'low'
    });
  }

  // Verificar tamanho do CSS
  if (totals.css.sizeKB > 100) {
    results.recommendations.push({
      type: 'warning',
      category: 'css-size',
      message: `CSS bundle is ${totals.css.sizeKB}KB. Consider purging unused CSS.`,
      impact: 'medium'
    });
  }

  // Verificar arquivos grandes
  Object.entries(files).forEach(([filePath, fileData]) => {
    if (fileData.sizeKB > 100) {
      results.recommendations.push({
        type: 'warning',
        category: 'large-file',
        message: `Large file detected: ${filePath} (${fileData.sizeKB}KB)`,
        impact: 'medium'
      });
    }
  });

  // Verificar número de arquivos JS
  if (totals.js.count > 10) {
    results.recommendations.push({
      type: 'info',
      category: 'file-count',
      message: `${totals.js.count} JavaScript files detected. Consider bundling optimization.`,
      impact: 'low'
    });
  }
}

// Função para gerar relatório
function generateReport(analysis) {
  console.log('\n🚀 PERFORMANCE ANALYSIS REPORT');
  console.log('================================\n');
  
  console.log('📊 Bundle Size Summary:');
  console.log(`   JavaScript: ${analysis.totals.js.sizeKB}KB (${analysis.totals.js.count} files)`);
  console.log(`   CSS:        ${analysis.totals.css.sizeKB}KB (${analysis.totals.css.count} files)`);
  console.log(`   HTML:       ${analysis.totals.html.sizeKB}KB (${analysis.totals.html.count} files)`);
  console.log(`   Assets:     ${analysis.totals.assets.sizeKB}KB (${analysis.totals.assets.count} files)`);
  
  const totalSize = Object.values(analysis.totals).reduce((sum, total) => sum + total.size, 0);
  console.log(`   TOTAL:      ${Math.round(totalSize / 1024 * 100) / 100}KB\n`);

  console.log('🎯 Recommendations:');
  analysis.recommendations.forEach((rec, index) => {
    const icon = rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`   ${icon} ${rec.message}`);
  });

  console.log('\n📁 Largest Files:');
  const sortedFiles = Object.entries(analysis.files)
    .sort(([,a], [,b]) => b.size - a.size)
    .slice(0, 5);
  
  sortedFiles.forEach(([filePath, fileData]) => {
    console.log(`   ${fileData.sizeKB}KB - ${filePath}`);
  });

  console.log('\n💡 Performance Tips:');
  console.log('   • Use "npm run build:analyze" to visualize bundle composition');
  console.log('   • Monitor Core Web Vitals with Ctrl+Shift+P in the app');
  console.log('   • Check Network tab in DevTools for loading performance');
  console.log('   • Use Lighthouse for comprehensive performance audit\n');
}

// Função principal
function main() {
  console.log('🔍 Analyzing bundle performance...\n');
  
  const analysis = analyzeBundleSize();
  if (!analysis) {
    process.exit(1);
  }

  // Salvar análise em arquivo
  fs.writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(analysis, null, 2));
  console.log(`📄 Analysis saved to: ${ANALYSIS_OUTPUT}`);

  // Gerar relatório
  generateReport(analysis);

  // Verificar se há problemas críticos
  const criticalIssues = analysis.recommendations.filter(rec => 
    rec.type === 'warning' && rec.impact === 'high'
  );

  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL PERFORMANCE ISSUES DETECTED!');
    criticalIssues.forEach(issue => {
      console.log(`   ❌ ${issue.message}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 No critical performance issues detected!');
    process.exit(0);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  analyzeBundleSize,
  generateReport
};
