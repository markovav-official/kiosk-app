export function WaitingScreen({ connected }) {
  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-center p-8 z-10 bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-10 py-8 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <h1 className="text-base font-semibold text-zinc-500 mb-6 tracking-[0.2em] uppercase">
          Kiosk Client
        </h1>
        <p
          className={`text-sm font-medium transition-colors ${
            connected ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          {connected
            ? 'Подключено к серверу'
            : 'Ожидание ответа от сервера…'}
        </p>
        <div
          className="inline-flex gap-2.5 mt-8"
          aria-hidden="true"
        >
          <span
            className="h-2.5 w-2.5 rounded-full bg-zinc-500 animate-waiting-dot"
            style={{ animationDelay: '-0.32s' }}
          />
          <span
            className="h-2.5 w-2.5 rounded-full bg-zinc-500 animate-waiting-dot"
            style={{ animationDelay: '-0.16s' }}
          />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-500 animate-waiting-dot" />
        </div>
      </div>
    </div>
  );
}
