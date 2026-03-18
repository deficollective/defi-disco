---
name: fix-array-errors
description: Find array overflow errors ("Too many values") in discovered.json and interactively add ignoreMethods to config.jsonc. Shows a numbered table with method context so the user can select which to ignore.
---

# Fix Array Errors

Find array overflow errors in discovery output and add `ignoreMethods` entries to suppress them.

## Arguments

```
/fix-array-errors <project>
```

- **project** — project folder name (e.g. `aerodrome`, `aave-v3`)

## Instructions

### Phase 1: Analyze

Run the analysis script:

```bash
python3 .claude/skills/fix-array-errors/scripts/analyze.py \
  packages/config/src/projects/<project>/discovered.json \
  packages/config/src/projects/<project>/config.jsonc
```

**IMPORTANT: Always display the full script output inside a markdown code block (triple backticks) so the table renders correctly with proper alignment.** Do not summarize or truncate.

**IMPORTANT: The script reads from discovered.json. If discovery was re-run since the last analysis, re-run this script too — addresses may have changed.** Always use the addresses from the script output, never from memory.

The script outputs:
1. A numbered table with columns: `#`, `Contract`, `Address`, `Field`, `Returns`, `Category`, `Sample val`
2. A grouped summary by contract (with full address) showing which numbers belong to each

### Phase 2: Get user input

Ask the user which items to ignore. They respond with numbers like:
> ignore 1,4,6,9,10,11

Or:
> ignore all
> ignore all except 3,7

### Phase 3: Apply

For each selected item, add the field name to `ignoreMethods` on the corresponding contract in `config.jsonc`.

**CRITICAL: Use the exact address from the grouped output (full address, not shortened).** Do not reuse addresses from a previous run.

- If the contract already has an `ignoreMethods` array, append to it
- If the contract already has an override but no `ignoreMethods`, add the property
- If the contract has no override, create one

Group methods by contract address — don't create duplicate override entries.

Report what was added:
```
Applied ignoreMethods:
  ContractA: +field1, +field2
  ContractB: +field3
```
