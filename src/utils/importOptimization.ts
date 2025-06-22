// 🚀 IMPORT OPTIMIZATION SYSTEM
// Sistema para analisar e otimizar imports para melhor tree shaking

interface ImportAnalysis {
  file: string;
  imports: ImportInfo[];
  recommendations: string[];
  optimizationPotential: number;
}

interface ImportInfo {
  module: string;
  imports: string[];
  type: 'named' | 'default' | 'namespace' | 'side-effect';
  isOptimized: boolean;
  size: number;
  alternatives?: string[];
}

interface OptimizationRule {
  module: string;
  pattern: RegExp;
  replacement: string;
  reason: string;
  savings: number;
}

class ImportOptimizer {
  private optimizationRules: OptimizationRule[] = [];
  private knownLargeModules: Set<string> = new Set();

  constructor() {
    this.initializeRules();
    this.initializeLargeModules();
  }

  private initializeRules() {
    // 🎯 REGRAS DE OTIMIZAÇÃO ESPECÍFICAS
    this.optimizationRules = [
      {
        module: 'lucide-react',
        pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/g,
        replacement: 'import { $1 } from "lucide-react/dist/esm/icons/$1"',
        reason: 'Import specific icons to reduce bundle size',
        savings: 15000 // ~15KB savings
      },
      {
        module: 'lodash',
        pattern: /import\s+_\s+from\s+['"]lodash['"]/g,
        replacement: 'import { specific } from "lodash/specific"',
        reason: 'Use specific lodash functions instead of entire library',
        savings: 50000 // ~50KB savings
      },
      {
        module: '@tanstack/react-query',
        pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@tanstack\/react-query['"]/g,
        replacement: 'import { $1 } from "@tanstack/react-query"',
        reason: 'Already optimized for tree shaking',
        savings: 0
      },
      {
        module: 'react-router-dom',
        pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]react-router-dom['"]/g,
        replacement: 'import { $1 } from "react-router-dom"',
        reason: 'Already optimized for tree shaking',
        savings: 0
      }
    ];
  }

  private initializeLargeModules() {
    // 🚨 MÓDULOS CONHECIDOS POR SEREM GRANDES
    this.knownLargeModules.add('lodash');
    this.knownLargeModules.add('moment');
    this.knownLargeModules.add('antd');
    this.knownLargeModules.add('material-ui');
    this.knownLargeModules.add('chart.js');
    this.knownLargeModules.add('three');
  }

  // 🔍 ANALYZE IMPORTS: Analisar imports de um arquivo
  analyzeImports(fileContent: string, fileName: string): ImportAnalysis {
    const imports: ImportInfo[] = [];
    const recommendations: string[] = [];
    let optimizationPotential = 0;

    // Regex para diferentes tipos de import
    const importPatterns = {
      named: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g,
      default: /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
      namespace: /import\s*\*\s*as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
      sideEffect: /import\s*['"]([^'"]+)['"]/g
    };

    // Analisar imports nomeados
    let match;
    while ((match = importPatterns.named.exec(fileContent)) !== null) {
      const [, importList, module] = match;
      const importNames = importList.split(',').map(name => name.trim());
      
      const importInfo: ImportInfo = {
        module,
        imports: importNames,
        type: 'named',
        isOptimized: this.isOptimizedImport(module, importNames),
        size: this.estimateImportSize(module, importNames)
      };

      // Verificar se há alternativas melhores
      const alternatives = this.getAlternatives(module);
      if (alternatives.length > 0) {
        importInfo.alternatives = alternatives;
      }

      imports.push(importInfo);

      // Gerar recomendações
      const moduleRecommendations = this.getRecommendationsForModule(module, importNames);
      recommendations.push(...moduleRecommendations);

      // Calcular potencial de otimização
      if (!importInfo.isOptimized) {
        optimizationPotential += this.calculateOptimizationPotential(module, importNames);
      }
    }

    // Analisar imports default
    importPatterns.default.lastIndex = 0;
    while ((match = importPatterns.default.exec(fileContent)) !== null) {
      const [, importName, module] = match;
      
      const importInfo: ImportInfo = {
        module,
        imports: [importName],
        type: 'default',
        isOptimized: !this.knownLargeModules.has(module),
        size: this.estimateImportSize(module, [importName])
      };

      imports.push(importInfo);
    }

    // Analisar namespace imports
    importPatterns.namespace.lastIndex = 0;
    while ((match = importPatterns.namespace.exec(fileContent)) !== null) {
      const [, importName, module] = match;
      
      const importInfo: ImportInfo = {
        module,
        imports: [importName],
        type: 'namespace',
        isOptimized: false, // Namespace imports geralmente não são otimizados
        size: this.estimateImportSize(module, ['*'])
      };

      imports.push(importInfo);
      recommendations.push(`Consider using named imports instead of namespace import for ${module}`);
      optimizationPotential += 10000; // Estimativa
    }

    return {
      file: fileName,
      imports,
      recommendations: [...new Set(recommendations)], // Remove duplicatas
      optimizationPotential
    };
  }

  // 🎯 IS OPTIMIZED IMPORT: Verificar se import está otimizado
  private isOptimizedImport(module: string, imports: string[]): boolean {
    // Verificar se o módulo suporta tree shaking
    const treeShakeableModules = [
      '@tanstack/react-query',
      'react-router-dom',
      'lucide-react',
      'date-fns'
    ];

    if (!treeShakeableModules.includes(module)) {
      return false;
    }

    // Verificar se está usando imports específicos
    if (this.knownLargeModules.has(module) && imports.includes('*')) {
      return false;
    }

    return true;
  }

  // 📊 ESTIMATE IMPORT SIZE: Estimar tamanho do import
  private estimateImportSize(module: string, imports: string[]): number {
    const moduleSizes: Record<string, number> = {
      'react': 45000,
      'react-dom': 130000,
      'lucide-react': 500, // Por ícone
      '@tanstack/react-query': 60000,
      'react-router-dom': 25000,
      '@supabase/supabase-js': 80000,
      'lodash': 2000, // Por função
      'moment': 67000,
      'date-fns': 500 // Por função
    };

    const baseSize = moduleSizes[module] || 5000; // Default 5KB

    if (imports.includes('*')) {
      return baseSize; // Tamanho completo
    }

    // Estimar baseado no número de imports
    const perImportSize = baseSize / 10; // Estimativa
    return Math.min(baseSize, imports.length * perImportSize);
  }

  // 🔄 GET ALTERNATIVES: Obter alternativas para módulos
  private getAlternatives(module: string): string[] {
    const alternatives: Record<string, string[]> = {
      'moment': ['date-fns', 'dayjs'],
      'lodash': ['ramda', 'native ES6 methods'],
      'axios': ['fetch API', '@supabase/supabase-js'],
      'jquery': ['native DOM methods', 'vanilla JS']
    };

    return alternatives[module] || [];
  }

  // 💡 GET RECOMMENDATIONS: Obter recomendações para módulo
  private getRecommendationsForModule(module: string, imports: string[]): string[] {
    const recommendations: string[] = [];

    // Verificar regras de otimização
    const rule = this.optimizationRules.find(r => r.module === module);
    if (rule && rule.savings > 0) {
      recommendations.push(`${rule.reason} (saves ~${this.formatBytes(rule.savings)})`);
    }

    // Verificar módulos grandes
    if (this.knownLargeModules.has(module)) {
      recommendations.push(`Consider alternatives for ${module} to reduce bundle size`);
    }

    // Verificar imports desnecessários
    if (imports.length > 10) {
      recommendations.push(`Review if all ${imports.length} imports from ${module} are necessary`);
    }

    return recommendations;
  }

  // 📈 CALCULATE OPTIMIZATION POTENTIAL: Calcular potencial de otimização
  private calculateOptimizationPotential(module: string, imports: string[]): number {
    const rule = this.optimizationRules.find(r => r.module === module);
    if (rule) {
      return rule.savings;
    }

    if (this.knownLargeModules.has(module)) {
      return 20000; // Estimativa de 20KB
    }

    return 0;
  }

  // 🚀 OPTIMIZE IMPORTS: Otimizar imports automaticamente
  optimizeImports(fileContent: string): { optimized: string; changes: string[] } {
    let optimized = fileContent;
    const changes: string[] = [];

    this.optimizationRules.forEach(rule => {
      const matches = optimized.match(rule.pattern);
      if (matches) {
        optimized = optimized.replace(rule.pattern, rule.replacement);
        changes.push(`Optimized ${rule.module}: ${rule.reason}`);
      }
    });

    return { optimized, changes };
  }

  // 📊 GENERATE REPORT: Gerar relatório de otimização
  generateOptimizationReport(analyses: ImportAnalysis[]): string {
    const totalFiles = analyses.length;
    const totalImports = analyses.reduce((sum, analysis) => sum + analysis.imports.length, 0);
    const totalOptimizationPotential = analyses.reduce((sum, analysis) => sum + analysis.optimizationPotential, 0);
    const unoptimizedImports = analyses.reduce((sum, analysis) => 
      sum + analysis.imports.filter(imp => !imp.isOptimized).length, 0
    );

    const report = {
      summary: {
        totalFiles,
        totalImports,
        unoptimizedImports,
        optimizationPotential: this.formatBytes(totalOptimizationPotential),
        optimizationPercentage: totalImports > 0 ? ((unoptimizedImports / totalImports) * 100).toFixed(1) + '%' : '0%'
      },
      topRecommendations: this.getTopRecommendations(analyses),
      fileAnalyses: analyses.map(analysis => ({
        file: analysis.file,
        imports: analysis.imports.length,
        unoptimized: analysis.imports.filter(imp => !imp.isOptimized).length,
        potential: this.formatBytes(analysis.optimizationPotential),
        recommendations: analysis.recommendations.slice(0, 3) // Top 3
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  // 🏆 GET TOP RECOMMENDATIONS: Obter principais recomendações
  private getTopRecommendations(analyses: ImportAnalysis[]): string[] {
    const allRecommendations = analyses.flatMap(analysis => analysis.recommendations);
    const recommendationCounts = new Map<string, number>();

    allRecommendations.forEach(rec => {
      recommendationCounts.set(rec, (recommendationCounts.get(rec) || 0) + 1);
    });

    return Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rec]) => rec);
  }

  // 🔧 FORMAT BYTES: Formatar bytes
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 🚀 SINGLETON
export const importOptimizer = new ImportOptimizer();

// 🎯 UTILITIES
export const analyzeFileImports = (content: string, fileName: string) => 
  importOptimizer.analyzeImports(content, fileName);

export const optimizeFileImports = (content: string) => 
  importOptimizer.optimizeImports(content);

export const generateImportReport = (analyses: ImportAnalysis[]) => 
  importOptimizer.generateOptimizationReport(analyses);
