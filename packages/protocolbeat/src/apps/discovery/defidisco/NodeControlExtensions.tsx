import React from 'react'
import { ExcludeButton } from './ExcludeButton'
import { ExternalButton } from './ExternalButton'
import { FundsTagsButton } from './FundsTagsButton'
import { GovernanceButton } from './GovernanceButton'

export function NodeControlExtensions() {
  return (
    <>
      <ExternalButton />
      <GovernanceButton />
      <ExcludeButton />
      <FundsTagsButton />
    </>
  )
}
