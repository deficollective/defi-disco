import { truncateAddress, etherscanUrl } from '../utils/format'

interface AddressDisplayProps {
  address: string
  className?: string
}

export function AddressDisplay({ address, className }: AddressDisplayProps) {
  return (
    <a
      href={etherscanUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className={`font-mono text-sm text-brand-600 hover:text-brand-700 transition-colors duration-150 ${className ?? ''}`}
      title={address}
    >
      {truncateAddress(address)}
    </a>
  )
}
