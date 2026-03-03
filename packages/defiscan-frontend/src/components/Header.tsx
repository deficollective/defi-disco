import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-purple-600">DeFiScan</span>
          <span className="text-xs font-medium text-text-muted bg-bg-muted px-2 py-0.5 rounded-full">
            Compare
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-text-secondary">
          <Link to="/" className="hover:text-purple-600 transition-colors">
            Compare
          </Link>
          <a
            href="https://deficollective.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-600 transition-colors"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  )
}
