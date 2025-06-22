/**
 * 🔧 COMPONENTE DE DIAGNÓSTICO DOS FILTROS
 * Para testar e debuggar filtros em desenvolvimento
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { filterTester, initializeFilterTests } from '../../utils/filterTester';
import { advancedCache } from '../../lib/advancedCache';

interface DiagnosticResult {
  component: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const FilterDiagnostics: React.FC = () => {
  const { state } = useAppContext();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 🔧 EXECUTAR DIAGNÓSTICOS
  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // 1. Testar estado do AppContext
      results.push({
        component: 'AppContext',
        status: state ? 'ok' : 'error',
        message: state ? 'Estado carregado corretamente' : 'Estado não encontrado',
        details: {
          stagedFilters: state?.stagedFilters,
          appliedFilters: state?.appliedFilters
        }
      });

      // 2. Testar filtros staged vs applied
      const imoveisStaged = state?.stagedFilters?.imoveis;
      const imoveisApplied = state?.appliedFilters?.imoveis;
      
      results.push({
        component: 'Filtros Imóveis',
        status: imoveisStaged && imoveisApplied ? 'ok' : 'warning',
        message: imoveisStaged && imoveisApplied ? 'Filtros sincronizados' : 'Filtros podem estar dessincronizados',
        details: {
          staged: imoveisStaged,
          applied: imoveisApplied
        }
      });

      // 3. Testar cache
      const cacheStats = advancedCache.getStats();
      results.push({
        component: 'Cache',
        status: cacheStats.totalEntries > 0 ? 'ok' : 'warning',
        message: `Cache com ${cacheStats.totalEntries} entradas`,
        details: cacheStats
      });

      // 4. Testar ranges
      const hasValidRanges = checkRangeValidity();
      results.push({
        component: 'Ranges',
        status: hasValidRanges ? 'ok' : 'warning',
        message: hasValidRanges ? 'Ranges válidos' : 'Alguns ranges podem estar inválidos',
        details: {
          areaM2: imoveisStaged?.areaM2,
          valorAvaliacao: imoveisStaged?.valorAvaliacao
        }
      });

      // 5. Executar testes automatizados
      initializeFilterTests();
      const testResults = await filterTester.runAllTests();
      
      for (const [category, suite] of testResults) {
        results.push({
          component: `Testes ${category}`,
          status: suite.summary.failed === 0 ? 'ok' : 'error',
          message: `${suite.summary.passed}/${suite.summary.total} testes passaram`,
          details: suite.results
        });
      }

    } catch (error) {
      results.push({
        component: 'Sistema',
        status: 'error',
        message: `Erro durante diagnóstico: ${error}`,
        details: error
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  // 🔧 VERIFICAR VALIDADE DOS RANGES
  const checkRangeValidity = (): boolean => {
    const filters = state?.stagedFilters?.imoveis;
    if (!filters) return false;

    // Verificar se ranges não são negativos
    if (filters.areaM2 && (filters.areaM2[0] < 0 || filters.areaM2[1] < 0)) return false;
    if (filters.valorAvaliacao && (filters.valorAvaliacao[0] < 0 || filters.valorAvaliacao[1] < 0)) return false;

    // Verificar se min <= max
    if (filters.areaM2 && filters.areaM2[0] > filters.areaM2[1]) return false;
    if (filters.valorAvaliacao && filters.valorAvaliacao[0] > filters.valorAvaliacao[1]) return false;

    return true;
  };

  // 🔧 EXECUTAR DIAGNÓSTICOS NA INICIALIZAÇÃO
  useEffect(() => {
    runDiagnostics();
  }, []);

  // 🔧 RENDERIZAR STATUS
  const renderStatus = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'ok':
        return <span className="text-green-600">✅</span>;
      case 'warning':
        return <span className="text-yellow-600">⚠️</span>;
      case 'error':
        return <span className="text-red-600">❌</span>;
    }
  };

  // 🔧 CONTAR STATUS
  const statusCounts = diagnostics.reduce(
    (acc, result) => {
      acc[result.status]++;
      return acc;
    },
    { ok: 0, warning: 0, error: 0 }
  );

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">🔧 Diagnóstico dos Filtros</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showDetails ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {/* Resumo */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="text-green-600">✅ {statusCounts.ok}</span>
        <span className="text-yellow-600">⚠️ {statusCounts.warning}</span>
        <span className="text-red-600">❌ {statusCounts.error}</span>
      </div>

      {/* Botão de executar */}
      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-3"
      >
        {isRunning ? 'Executando...' : 'Executar Diagnósticos'}
      </button>

      {/* Detalhes */}
      {showDetails && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {diagnostics.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {result.component}
                </span>
                {renderStatus(result.status)}
              </div>
              <p className="text-xs text-gray-600 mt-1">{result.message}</p>
              {result.details && (
                <details className="mt-1">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Detalhes
                  </summary>
                  <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status geral */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            Status: {statusCounts.error > 0 ? '❌ Problemas' : statusCounts.warning > 0 ? '⚠️ Atenção' : '✅ OK'}
          </span>
          <span className="text-gray-400">
            {diagnostics.length} verificações
          </span>
        </div>
      </div>
    </div>
  );
};

// 🔧 HOOK PARA USAR DIAGNÓSTICOS
export const useFilterDiagnostics = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Só habilitar em desenvolvimento
  useEffect(() => {
    setIsEnabled(process.env.NODE_ENV === 'development');
  }, []);

  return {
    isEnabled,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false)
  };
};
