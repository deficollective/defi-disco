import type { DiscoveryPaths } from '@l2beat/discovery'
import * as fs from 'fs'
import * as path from 'path'
import type { ApiReviewConfigResponse, ReviewConfig } from './types'

export function getReviewConfig(
  paths: DiscoveryPaths,
  project: string,
): ApiReviewConfigResponse {
  const configPath = getReviewConfigPath(paths, project)

  let config: ReviewConfig | null = null
  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf8')
      config = JSON.parse(fileContent) as ReviewConfig
    } catch (error) {
      console.error('Error parsing review config file:', error)
    }
  }

  return {
    config,
    availableTemplates: ['stablecoin'],
  }
}

export function updateReviewConfig(
  paths: DiscoveryPaths,
  project: string,
  config: ReviewConfig,
): void {
  const configPath = getReviewConfigPath(paths, project)

  const dir = path.dirname(configPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function getReviewConfigPath(
  paths: DiscoveryPaths,
  project: string,
): string {
  return path.join(paths.discovery, project, 'review-config.json')
}
