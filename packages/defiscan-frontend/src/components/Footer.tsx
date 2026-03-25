export function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-border/15 mt-16">
      <div className="mx-auto max-w-[1536px] px-12 py-8 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 pb-1">
            <img
              src="/defiscan-mark-blue.svg"
              alt=""
              className="size-6"
            />
            <span className="text-xl font-black text-text-primary tracking-[-1px]">
              DEFISCAN
            </span>
          </div>
          <p className="text-[11px] font-normal text-text-muted uppercase tracking-[0.55px]">
            &copy; 2026 DeFi Collective. All rights reserved.
          </p>
        </div>
        <nav className="flex items-center gap-8">
          <FooterLink href="#">Terms of Service</FooterLink>
          <FooterLink href="#">Privacy Policy</FooterLink>
          <FooterLink href="#">Contact</FooterLink>
          <FooterLink href="#">Documentation</FooterLink>
        </nav>
      </div>
    </footer>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="text-[11px] font-normal text-text-muted underline uppercase tracking-[0.55px] hover:text-text-secondary transition-colors"
    >
      {children}
    </a>
  )
}
