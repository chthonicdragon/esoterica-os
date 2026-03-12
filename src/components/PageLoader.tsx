export function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-primary/30 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border border-[hsl(var(--neon))/20] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⭐</div>
        </div>
        <p className="text-sm text-muted-foreground font-cinzel">LOADING</p>
      </div>
    </div>
  )
}
