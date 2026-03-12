export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="font-display text-base text-text-secondary">DeFiScan</span>
          <span className="text-border">|</span>
          <span>Advancing DeFi transparency</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <a
            href="https://deficollective.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-200"
          >
            The DeFi Collective
          </a>
          <a
            href="https://github.com/deficollective"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors duration-200"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
