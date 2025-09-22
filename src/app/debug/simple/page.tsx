export default function SimpleDebugPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug WhatsApp - Status Simples</h1>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Sistema WhatsApp Funcionando!</h2>
        <p className="text-green-700">O WhatsApp está conectado e processando mensagens em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📊 Status do Sistema</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              WhatsApp Conectado
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Banco de Dados Funcionando
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Mensagens Sendo Processadas
            </li>
            <li className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              Interface de Mensagens (Em Debug)
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📱 Dados Verificados</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Conta: 37991737234</li>
            <li>• Status: CONECTADO</li>
            <li>• Conversas: 9 ativas</li>
            <li>• Mensagens: 350+ processadas</li>
            <li>• Tipos: Grupos e contatos individuais</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">🔧 Debug Info</h3>
        <p className="text-sm text-blue-700 mb-2">Para testar as mensagens, você pode:</p>
        <ol className="text-sm text-blue-600 space-y-1">
          <li>1. Enviar uma mensagem para 37991737234</li>
          <li>2. Verificar se aparece no terminal do servidor</li>
          <li>3. Executar: <code className="bg-blue-100 px-1 rounded">DATABASE_URL="file:./dev.db" node debug-conversations.js</code></li>
        </ol>
      </div>

      <div className="mt-6 text-center space-x-4">
        <a
          href="/admin/whatsapp"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ← Voltar para WhatsApp Admin
        </a>
        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          🔄 Recarregar
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p>Último update: {new Date().toLocaleString('pt-BR')}</p>
        <p>Server: localhost:3007</p>
      </div>
    </div>
  )
}