import { Badge } from '../../../components/Badge'
import { AddressDisplay } from '../../../components/AddressDisplay'
import { Expandable } from '../../../components/Expandable'
import type { CompiledDependency } from '../../../types'

interface DependencyCardProps {
  dependency: CompiledDependency
}

export function DependencyCard({ dependency }: DependencyCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-2 flex-wrap">
        {dependency.entity && (
          <Badge variant="purple">{dependency.entity}</Badge>
        )}
        <h3 className="font-semibold text-text-primary">{dependency.name}</h3>
      </div>
      <div className="mt-1">
        <AddressDisplay address={dependency.address} />
      </div>
      {dependency.description && (
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {dependency.description}
        </p>
      )}

      {dependency.functions.length > 0 && (
        <div className="mt-3">
          <Expandable
            trigger={
              <span className="text-sm font-medium text-text-secondary">
                Used by {dependency.functions.length} function
                {dependency.functions.length !== 1 ? 's' : ''}
              </span>
            }
          >
            <ul className="mt-2 space-y-1">
              {dependency.functions.map((fn) => (
                <li
                  key={`${fn.contractAddress}-${fn.functionName}`}
                  className="text-sm"
                >
                  <span className="text-text-muted">{fn.contractName}</span>
                  <span className="text-text-primary font-medium">
                    .{fn.functionName}()
                  </span>
                </li>
              ))}
            </ul>
          </Expandable>
        </div>
      )}
    </div>
  )
}
