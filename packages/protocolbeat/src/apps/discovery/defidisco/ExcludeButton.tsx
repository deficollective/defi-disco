import { useParams } from 'react-router-dom'
import { ControlButton } from '../panel-nodes/controls/ControlButton'
import { useStore } from '../panel-nodes/store/store'
import { findByAddress } from './addressUtils'
import { useContractTags, useUpdateContractTag } from './hooks/useContractTags'

export function ExcludeButton() {
  const { project } = useParams()
  if (!project) {
    throw new Error('Missing project!')
  }

  const selected = useStore((state) => state.selected)
  const nodes = useStore((state) => state.nodes)
  const updateContractTag = useUpdateContractTag(project)
  const { data: contractTags } = useContractTags(project)

  const selectedNodes = nodes.filter((node) => selected.includes(node.id))
  const selectionExists = selected.length > 0

  const hasExcludedContract = selectedNodes.some((node) => {
    const tag = findByAddress(
      contractTags?.tags ?? [],
      (t) => t.contractAddress,
      node.address,
    )
    return tag?.excludeFromReview
  })

  const handleToggle = async () => {
    const newValue = !hasExcludedContract
    const promises = selectedNodes.map((node) =>
      updateContractTag.mutateAsync({
        contractAddress: node.address,
        excludeFromReview: newValue,
      }),
    )
    await Promise.all(promises)
  }

  return (
    <ControlButton disabled={!selectionExists} onClick={handleToggle}>
      Exclude
    </ControlButton>
  )
}
