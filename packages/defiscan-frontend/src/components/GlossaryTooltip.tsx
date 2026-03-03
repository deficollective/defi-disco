import { useState } from 'react'
import { clsx } from 'clsx'

const GLOSSARY: Record<string, string> = {
  EOA: 'Externally Owned Account -- a single private key that controls the address. If the key is lost or stolen, the attacker has full control.',
  Multisig:
    'Multi-signature wallet requiring multiple parties (e.g. 3 of 5 keyholders) to approve a transaction before it executes.',
  Timelock:
    'A smart contract that enforces a waiting period before approved changes take effect, giving users time to exit if they disagree.',
  Proxy:
    'A contract pattern where the logic can be swapped out while keeping the same address. Enables upgrades but introduces centralization risk.',
  Immutable:
    'Code that cannot be changed after deployment. Provides the strongest decentralization guarantee but cannot be patched if bugs are found.',
  'Smart Contract':
    'Self-executing code on the blockchain that enforces rules automatically, without intermediaries.',
  Governance:
    'A system (often a DAO) that allows token holders to vote on protocol changes.',
  Oracle:
    'An external data feed that brings off-chain information (like asset prices) onto the blockchain.',
  TVL: 'Total Value Locked -- the total amount of assets deposited in a protocol.',
  CDP: 'Collateralized Debt Position -- users deposit collateral to borrow assets against it.',
  'Capital at Risk':
    'The total value of funds held in contracts controlled by a given admin. If that admin is compromised, these funds could be affected.',
}

interface GlossaryTooltipProps {
  term: string
  children?: React.ReactNode
  className?: string
}

export function GlossaryTooltip({
  term,
  children,
  className,
}: GlossaryTooltipProps) {
  const [show, setShow] = useState(false)
  const definition = GLOSSARY[term]

  if (!definition) {
    return <span className={className}>{children ?? term}</span>
  }

  return (
    <span
      className={clsx('relative inline-block', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="border-b border-dotted border-purple-400 cursor-help">
        {children ?? term}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg bg-bg-dark text-white text-sm p-3 leading-relaxed shadow-lg z-50 pointer-events-none">
          <span className="font-semibold text-purple-300">{term}</span>
          <br />
          {definition}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-bg-dark" />
        </span>
      )}
    </span>
  )
}
