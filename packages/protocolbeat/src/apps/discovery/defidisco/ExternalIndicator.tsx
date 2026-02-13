import { useParams } from 'react-router-dom'
import { IS_READONLY } from '../../../config/readonly'
import { useExternalToggle } from '../../../hooks/useExternalToggle'
import { DependencyPropagationDialog } from './DependencyPropagationDialog'

export function ExternalIndicator({
  address,
  name,
}: {
  address: string
  name?: string
}) {
  const { project } = useParams()
  if (!project) return null

  const { hasExternalContract, handleToggleExternal, propagationDialogProps } =
    useExternalToggle(project, [{ address, name }])

  return (
    <>
      {hasExternalContract && (
        <span className="text-aux-orange font-bold"> (External)</span>
      )}
      {!IS_READONLY && (
        <button
          onClick={handleToggleExternal}
          title={
            hasExternalContract
              ? 'Mark as internal contract'
              : 'Mark as external dependency'
          }
          className="ml-2 bg-aux-orange/80 px-2 py-0.5 text-xs font-medium text-white transition-all duration-200 hover:bg-aux-orange disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasExternalContract ? 'Mark Internal' : 'Mark External'}
        </button>
      )}
      {propagationDialogProps.show && (
        <DependencyPropagationDialog
          mode={propagationDialogProps.mode}
          externalContracts={propagationDialogProps.externalContracts}
          affectedFunctions={propagationDialogProps.affectedFunctions}
          onConfirm={propagationDialogProps.onConfirm}
          onCancel={propagationDialogProps.onCancel}
          onSkip={propagationDialogProps.onSkip}
        />
      )}
    </>
  )
}
