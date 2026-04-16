# Aerodrome branch migration tracking

## Files taken from add/aerodrome → add/aerodrome-v2

### Batch 1: Aerodrome-specific files (11 files)
- [x] packages/config/src/projects/aerodrome/call-graph-data.json
- [x] packages/config/src/projects/aerodrome/config.jsonc
- [x] packages/config/src/projects/aerodrome/contract-tags.json
- [x] packages/config/src/projects/aerodrome/diffHistory.md
- [x] packages/config/src/projects/aerodrome/discovered.json
- [x] packages/config/src/projects/aerodrome/functions.json
- [x] packages/config/src/projects/aerodrome/funds-data.json
- [x] packages/config/src/projects/aerodrome/review-config.json
- [x] packages/defiscan-endpoints/src/services/aggregate/handlers/aerodromeClFactory.ts
- [x] packages/defiscan-endpoints/src/services/aggregate/handlers/aerodromeV2Factory.ts
- [x] packages/defiscan-frontend/public/data/aerodrome/compiled-review.json

### Batch 2: Config registration (1 file)
- [x] packages/config/src/defidisco-config.json — added "aerodrome" to defiProjects list

### Batch 3: Aggregate handler wiring (3 files)
- [x] packages/defiscan-endpoints/src/services/aggregate/handlers/index.ts — export aerodrome handlers
- [x] packages/defiscan-endpoints/src/services/aggregate/index.ts — re-export aerodrome handlers
- [x] packages/defiscan-endpoints/src/server.ts — register aerodrome handlers in AggregateService

### Batch 4: Multi-chain support (7 files)
- [x] packages/discovery/src/config/chains.ts — Base chain: etherscan → blockscout
- [x] packages/discovery/src/utils/BlockscoutModels.ts — libraries field accepts nested records
- [x] packages/l2b/.../defidisco/callGraph.ts — CHAIN_TO_SLITHER_NETWORK map, chain-aware Slither target, relaxed API key for Blockscout chains
- [x] packages/l2b/.../defidisco/fundsData.ts — DISCOVERY_TO_DEBANK_CHAIN map, dynamic chain_id in API URLs, token totalSupply from discovered.json
- [x] packages/defiscan-endpoints/src/services/TokenService.ts — removed total_supply from response
- [x] packages/defiscan-endpoints/src/types/api.ts — removed total_supply from TokenInfoResponse
- [x] packages/defiscan-endpoints/src/types/debank.ts — removed total_supply from DebankTokenInfoResponse

### Batch 5: UI chain-prefix fix (3 files)
- [x] packages/protocolbeat/.../defidisco/FundsTagsButton.tsx — node.address → node.id
- [x] packages/protocolbeat/.../defidisco/ExternalButton.tsx — node.address → node.id (tags + targets)
- [x] packages/protocolbeat/.../defidisco/GovernanceButton.tsx — node.address → node.id

### Batch 6: AI permission prompt improvements (2 files)
- [x] packages/l2b/.../defidisco/aiModels.ts — added Claude Opus 4.6 model
- [x] packages/l2b/.../defidisco/aiPermissionDetection.ts — 3-step analysis prompt for indirect access control

## Migration complete
All relevant changes from add/aerodrome brought to add/aerodrome-v2. Remaining diffs are stale (features added to main after divergence).
