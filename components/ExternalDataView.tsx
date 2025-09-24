import React, { useState } from 'react'
import { Card, Button } from './ui'
import { useExternalData, useExternalHospitals } from '../hooks/useExternalData'

// ============================================
// COMPONENTE PARA VISUALIZAR DADOS EXTERNOS
// ============================================
const ExternalDataView: React.FC = () => {
  const {
    externalData,
    loading,
    error,
    connected,
    loadAllExternalData,
    loadFromTable,
    testConnection
  } = useExternalData()

  const {
    hospitais: hospitaisExternos,
    loading: hospitaisLoading,
    error: hospitaisError,
    reload: reloadHospitais
  } = useExternalHospitals()

  const [customTableName, setCustomTableName] = useState('')
  const [customData, setCustomData] = useState<any[]>([])
  const [customLoading, setCustomLoading] = useState(false)

  // Função para carregar tabela customizada
  const loadCustomTable = async () => {
    if (!customTableName.trim()) return
    
    setCustomLoading(true)
    try {
      const data = await loadFromTable(customTableName.trim())
      setCustomData(data)
    } catch (err) {
      console.error('Erro ao carregar tabela customizada:', err)
    } finally {
      setCustomLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            Dados do Projeto Externo
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button 
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testando...' : 'Testar Conexão'}
          </Button>
          
          <Button 
            onClick={loadAllExternalData}
            disabled={loading || !connected}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Carregando...' : 'Carregar Todos os Dados'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="text-sm text-slate-600">
          <p><strong>Projeto ID:</strong> fvtfxunakabdrlkocdme</p>
          <p><strong>URL:</strong> https://fvtfxunakabdrlkocdme.supabase.co</p>
        </div>
      </Card>

      {/* Resumo dos Dados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">Hospitais</h3>
          <p className="text-2xl font-bold text-blue-600">
            {externalData.hospitais.length}
          </p>
          <p className="text-xs text-slate-500">registros encontrados</p>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">Usuários</h3>
          <p className="text-2xl font-bold text-green-600">
            {externalData.usuarios.length}
          </p>
          <p className="text-xs text-slate-500">registros encontrados</p>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">Médicos</h3>
          <p className="text-2xl font-bold text-purple-600">
            {externalData.medicos.length}
          </p>
          <p className="text-xs text-slate-500">registros encontrados</p>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">Procedimentos</h3>
          <p className="text-2xl font-bold text-orange-600">
            {externalData.procedimentos.length}
          </p>
          <p className="text-xs text-slate-500">registros encontrados</p>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">Agendamentos</h3>
          <p className="text-2xl font-bold text-red-600">
            {externalData.agendamentos.length}
          </p>
          <p className="text-xs text-slate-500">registros encontrados</p>
        </Card>
      </div>

      {/* Hospitais Externos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Hospitais do Projeto Externo
          </h3>
          <Button 
            onClick={reloadHospitais}
            disabled={hospitaisLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {hospitaisLoading ? 'Carregando...' : 'Recarregar'}
          </Button>
        </div>

        {hospitaisError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{hospitaisError}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Cidade</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">CNPJ</th>
              </tr>
            </thead>
            <tbody>
              {hospitaisExternos.map((hospital, index) => (
                <tr key={hospital.id || index} className="border-b border-slate-100">
                  <td className="py-2">{hospital.nome || 'N/A'}</td>
                  <td className="py-2">{hospital.cidade || 'N/A'}</td>
                  <td className="py-2">{hospital.estado || 'N/A'}</td>
                  <td className="py-2">{hospital.cnpj || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {hospitaisExternos.length === 0 && !hospitaisLoading && (
            <div className="text-center py-8 text-slate-500">
              Nenhum hospital encontrado
            </div>
          )}
        </div>
      </Card>

      {/* Busca Customizada */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Buscar Tabela Customizada
        </h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nome da tabela (ex: usuarios, medicos, etc.)"
            value={customTableName}
            onChange={(e) => setCustomTableName(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Button 
            onClick={loadCustomTable}
            disabled={customLoading || !connected || !customTableName.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {customLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {customData.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-slate-700 mb-2">
              Resultados ({customData.length} registros):
            </h4>
            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-slate-600">
                {JSON.stringify(customData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ExternalDataView
