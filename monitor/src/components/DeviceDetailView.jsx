import { api } from '../api/client'

export function DeviceDetailView({ client, media, onBack, onRefresh }) {
  const screenSrc = media?.screen ? `data:image/jpeg;base64,${media.screen}` : null
  const cameraSrc = media?.camera ? `data:image/jpeg;base64,${media.camera}` : null
  const displayName = client.display_name || client.hostname

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <header className="shrink-0 flex items-center justify-between gap-4 p-3 bg-slate-900 border-b border-slate-700">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
        >
          ← Назад к списку
        </button>
        <h1 className="text-lg font-semibold text-slate-200 truncate flex-1 text-center">
          {displayName}
        </h1>
        <div className="w-32" />
      </header>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0 rounded-lg overflow-hidden bg-black">
          <div className="text-sm text-slate-400 px-2 py-1">Экран</div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {screenSrc ? (
              <img
                src={screenSrc}
                alt="Экран"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-slate-500">Нет сигнала</span>
            )}
          </div>
        </div>
        <div className="flex flex-col min-h-0 rounded-lg overflow-hidden bg-black">
          <div className="text-sm text-slate-400 px-2 py-1">Камера</div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {cameraSrc ? (
              <img
                src={cameraSrc}
                alt="Камера"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-slate-500">Нет сигнала</span>
            )}
          </div>
        </div>
      </div>
      {client.current_url && (
        <div className="shrink-0 px-3 py-1 text-xs text-slate-400 truncate bg-slate-900">
          {client.current_url}
        </div>
      )}
    </div>
  )
}
