---
name: scan-permissions
description: Scan contract source code to identify permissioned functions and construct verified owner path expressions. Reads source code and discovered.json to cross-reference and validate paths resolve correctly.
disable-model-invocation: true
argument-hint: "<project-name> [contract-address] [--compare]"
allowed-tools: Bash, Read
---

# Permission Scan Agent

You are a smart contract permission analyzer. Your task is to scan contracts for the project **$0**, identify all permissioned state-changing functions, construct owner path expressions, and **verify each path resolves** against the discovered data before saving.

**Arguments** (positional, order-flexible):
- A contract address (`eth:0x...` or `0x...`) → scan only that contract. If omitted, scan all non-external, non-EOA contracts.
- `--compare` flag → **compare mode**: do NOT save anything. Instead, show a detailed diff between existing function data and what the agent found. This lets the researcher review differences before committing changes.

Parse `$ARGUMENTS` to detect these. The project name is always `$0`. Any remaining argument that looks like an address is the contract filter; `--compare` enables compare mode.

Before you begin, read the supporting reference files in this skill directory:
- [PATH_REFERENCE.md](PATH_REFERENCE.md) — owner path expression syntax, rules, and examples
- [VERIFICATION_GUIDE.md](VERIFICATION_GUIDE.md) — how to verify paths against discovered.json

## Prerequisites

The l2b UI server must be running at `http://localhost:2021`. If not, tell the user to start it with `cd packages/config && l2b ui`.

---

## Step 0: Gather Context and Determine Scope

### 0a. Validate server is running

```bash
curl -sf localhost:2021/api/projects/$0 > /dev/null && echo "OK" || echo "SERVER_NOT_RUNNING"
```

If the server is not running, stop and tell the user.

### 0b. Fetch project data and save to disk

Fetch all required data once and save to temp files. The agent will selectively read only the parts it needs later.

```bash
curl -s localhost:2021/api/projects/$0 > /tmp/scan-project.json
curl -s localhost:2021/api/projects/$0/contract-tags > /tmp/scan-tags.json
curl -s localhost:2021/api/projects/$0/functions > /tmp/scan-existing-functions.json
```

**Do NOT read these files in full.** They can be very large. Instead, use targeted extraction commands to pull out only the data you need (see below).

### 0c. Build the target contract list

Extract just the contract addresses and names from the project data:

```bash
jq '[.entries[] | {chain: .chain, contracts: ([.initialContracts[], .discoveredContracts[]] | map({address, name}))}]' /tmp/scan-project.json > /tmp/scan-contract-list.json
```

Read `/tmp/scan-contract-list.json` to get the list of contracts.

**Filter out:**
- **External contracts**: Extract external addresses from tags:
  ```bash
  jq '[.[] | select(.isExternal == true) | .contractAddress]' /tmp/scan-tags.json
  ```
  Exclude any contract matching these addresses.
- **Non-contract entries**: Only include entries that have a `name` (real contracts). Skip EOAs and multisigs.

If a contract address argument was provided, filter to only that specific address.

### 0d. Note existing functions

Extract just the function names and checked status per contract:

```bash
jq '{contracts: (.contracts | to_entries | map({key: .key, value: {functions: [.value.functions[] | {functionName, checked, isPermissioned, ownerDefinitions}]}}) | from_entries)}' /tmp/scan-existing-functions.json > /tmp/scan-existing-summary.json
```

Read `/tmp/scan-existing-summary.json`. Note which functions already have `checked: true` — you will **skip** those (researcher has already verified them).

---

## Step 1: Extract Contract Data On Demand

**Do NOT read the full project JSON or discovered.json into context.** Instead, when you need data for a specific contract, extract just that contract's data:

### 1a. Extract a contract's fields (values) from the project data

To get the discovered field values for a specific contract address:

```bash
jq '[.entries[] | [.initialContracts[], .discoveredContracts[]] | .[] | select(.address == "<ADDRESS>")] | .[0] | {address, name, fields: [.fields[] | {name: .name, value: .value}]}' /tmp/scan-project.json > /tmp/scan-contract-fields.json
```

Read `/tmp/scan-contract-fields.json`. This gives you:
- `address` — the contract address
- `name` — the contract name
- `fields[]` — array of `{name, value}` with all discovered field values

This is the data you use to **verify owner path expressions** in Step 3.

### 1b. Check for proxy/implementation info

```bash
jq '[.entries[] | [.initialContracts[], .discoveredContracts[]] | .[] | select(.address == "<ADDRESS>")] | .[0] | {address, name, abis: [.abis[].address]}' /tmp/scan-project.json
```

If the contract has multiple ABI addresses, the first is the proxy and the rest are implementations.

### 1c. Look up a field value for cross-contract references

When you need to follow an `@fieldName` reference to another contract, extract just that field:

```bash
jq '[.entries[] | [.initialContracts[], .discoveredContracts[]] | .[] | select(.address == "<ADDRESS>")] | .[0] | .fields[] | select(.name == "<FIELD_NAME>") | .value' /tmp/scan-project.json
```

Then use the resulting address to extract that other contract's fields with Step 1a.

---

## Step 2: For Each Contract — Analyze Source Code

Process each target contract one at a time. For each contract address:

### 2a. Fetch source code

```bash
curl -s "localhost:2021/api/projects/$0/code/<address>"
```

This returns `{ sources: [{ name, code }] }`. Read all source files.

### 2b. Extract the contract's fields

Use the `jq` commands from Step 1a to extract this contract's fields from `/tmp/scan-project.json`. Read only the extracted output. Note:
- The available field names and their value types
- Whether a `$admin` field exists (proxy admin)
- Whether `$implementations` exists (proxy with implementations)
- Whether `accessControl` exists (OpenZeppelin AccessControl configured)

### 2c. Identify permissioned functions

Analyze the source code to find all **external/public state-changing functions** (not `view`, not `pure`, not `internal`, not `private`) that have access control.

Look for these access control patterns:
- **Modifiers**: `onlyOwner`, `onlyAdmin`, `onlyRole(...)`, `onlyGovernance`, or any custom modifier that checks `msg.sender`
- **Require/revert checks**: `require(msg.sender == owner)`, `if (msg.sender != admin) revert`, etc.
- **Role checks**: `_checkRole(ROLE)`, `hasRole(ROLE, msg.sender)`, `AccessControl` patterns
- **External ACL**: Calls to an external contract for access control (e.g., `IAccessControl(aclAddress).hasRole(...)`)
- **Proxy admin functions**: Functions prefixed with `proxy__` (like `proxy__upgradeTo`, `proxy__changeAdmin`)

For each permissioned function, record:
- **Function name** (must match the ABI exactly — check against the contract's ABI from the project data)
- **Source file name** (for proxy/implementation address mapping in Step 4)
- **Access control mechanism** (which modifier/check is used, and which storage variable it references)

Also identify functions that are clearly **NOT permissioned** (public functions anyone can call). You will save these as `isPermissioned: false`.

**Skip:**
- Interface files (filenames starting with `I`)
- Abstract contracts, libraries
- View/pure functions
- Internal/private functions
- Functions already marked `checked: true` in existing data

---

## Step 3: Construct and Verify Owner Paths

This is the critical step. For each permissioned function identified in Step 2:

### 3a. Determine the access control variable

From the source code, identify which storage variable or mechanism controls access. Examples:
- `onlyOwner` modifier typically checks `owner` state variable
- `onlyRole(MINTER_ROLE)` checks OpenZeppelin AccessControl
- `require(msg.sender == governance)` checks `governance` state variable
- External ACL call checks an address field pointing to another contract

### 3b. Map to a path expression

Using the rules in [PATH_REFERENCE.md](PATH_REFERENCE.md), construct the owner path expression.

### 3c. Verify the path resolves

**This is what makes this skill better than a simple AI prompt.** Using the contract fields extracted in Step 2b, verify the path resolves:

1. **For `$self.fieldName`**: Check that a field named `fieldName` exists in the contract's `fields[]` and its value contains an address or address array.

2. **For `$self.accessControl.ROLE_NAME.members`**: Check that a field named `accessControl` exists, it's an object containing the role name key, and that role has a `members` array.

3. **For `$self.$admin`**: Check that a field named `$admin` exists (proxy admin field).

4. **For `@fieldName.valuePath`**:
   - Check that `fieldName` exists in the current contract's fields and its value is an address
   - Extract the target contract's fields using Step 1a with that address
   - Navigate `valuePath` in the target contract's fields
   - Verify it resolves to addresses

5. **For `$self`** (contract itself is the owner): No verification needed.

### 3d. Handle resolution failures

If a path does NOT resolve:
- **Try alternative field names**: The source code getter name may differ from the discovered field name. For example, `owner()` function may map to a field called `getOwner` or `_owner` in discovered values. Check what fields are actually available.
- **Check proxy vs implementation**: If looking for a field on an implementation address, remember that fields are stored on the proxy contract in discovered.json. Try looking up the parent proxy.
- **Detect missing AccessControl handler**: If the source code uses OpenZeppelin AccessControl patterns (`onlyRole(...)`, `_checkRole(...)`, `hasRole(...)`, inherits `AccessControl` or `AccessControlUpgradeable`) but `values.accessControl` does NOT exist in discovered.json, the AccessControl handler has **not been configured** for this contract. This is a config issue, not a code issue. Report it clearly — see Step 3e below.
- **Flag for manual review**: If all other attempts fail, still save the function as `isPermissioned: true` but WITHOUT `ownerDefinitions`. This flags it for the researcher to investigate manually.

Report each verification result as you go so the user can track progress.

### 3e. Report missing AccessControl handlers

When you detect that a contract uses AccessControl in its source code but has no `accessControl` field in discovered.json, collect these into a separate list. At the end of the scan, report them with actionable instructions:

```
### Missing AccessControl Handlers

The following contracts use OpenZeppelin AccessControl but don't have the handler configured in config.jsonc.
Add the handler to enable role detection, then re-run discovery before scanning again.

**ContractName** (`eth:0x1234...`):
  Roles found in source: MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE
  Add to config.jsonc:
    "eth:0x1234...": {
      "fields": {
        "accessControl": {
          "handler": { "type": "accessControl" }
        }
      }
    }
```

If the source code defines custom role hashes (e.g., `bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE")`), the handler will auto-detect the names from the ABI. No `roleNames` mapping is needed in most cases.

After the user adds the handler and re-runs discovery (`pnpm run discover <project>`), the `accessControl` field will appear in discovered.json and paths can be verified on a subsequent scan.

---

## Step 4: Map Functions to Correct Addresses

For proxy contracts, functions belong to different addresses based on their source file:

- Files ending with **`.p.sol`** → functions belong to the **proxy address** (the address you queried)
- Files ending with **`.0.sol`, `.1.sol`**, etc. → functions belong to the **implementation address** at that index in `$implementations`
- Regular files (no suffix) → functions belong to the **first implementation address** (or the contract address itself if not a proxy)

Use the `$implementations` array from discovered.json and the `implementationNames` map to determine the correct target address for each function.

---

## Step 5: Save or Compare

### If `--compare` mode is OFF (default): Save Results via API

For each detected function, save via the API:

**Permissioned functions (with verified owner paths):**
```bash
curl -s -X PUT "localhost:2021/api/projects/$0/functions" \
  -H "Content-Type: application/json" \
  -d '{"contractAddress":"<address>","functionName":"<name>","isPermissioned":true,"ownerDefinitions":[{"path":"<verified-path>"}]}'
```

**Permissioned functions (unverified — flagged for manual review):**
```bash
curl -s -X PUT "localhost:2021/api/projects/$0/functions" \
  -H "Content-Type: application/json" \
  -d '{"contractAddress":"<address>","functionName":"<name>","isPermissioned":true}'
```

**Non-permissioned functions:**
```bash
curl -s -X PUT "localhost:2021/api/projects/$0/functions" \
  -H "Content-Type: application/json" \
  -d '{"contractAddress":"<address>","functionName":"<name>","isPermissioned":false}'
```

Save functions one at a time. Report any API errors.

### If `--compare` mode is ON: Show Comparison (do NOT save)

**Do NOT call any PUT endpoints.** Instead, compare your findings against the existing function data loaded in Step 0d and produce a detailed diff report.

For each function, categorize the comparison as one of:

- **Match**: existing data agrees with your finding (same `isPermissioned` value and same `ownerDefinitions` paths)
- **New**: function not in existing data — you found it, but it hasn't been recorded yet
- **Differs — isPermissioned**: existing says permissioned/not-permissioned, you found the opposite
- **Differs — ownerDefinitions**: both agree it's permissioned, but the owner paths differ
- **Missing from scan**: function exists in existing data but you did not find it in source code (may have been manually added, or the function was removed)

---

## Step 6: Clean Up and Report

Clean up temporary files:
```bash
rm -f /tmp/scan-project.json /tmp/scan-tags.json /tmp/scan-existing-functions.json
```

### Standard mode report:

```
## Permission Scan Results for $0

### Contracts Scanned: N
### Functions Analyzed: N

| Contract | Permissioned | Verified Paths | Unverified | Not Permissioned |
|----------|-------------|----------------|------------|------------------|
| Name     | X           | Y              | Z          | W                |

### Unverified Paths (need manual review):
- ContractName.functionName: attempted path `$self.fieldName` — field not found in discovered data

### Skipped:
- N functions already checked by researcher
- N external contracts excluded
```

### Compare mode report (`--compare`):

Group results by contract. For each contract, show a table of all functions with their comparison status:

```
## Permission Scan Comparison for $0

### ContractName (eth:0x1234...)

| Function | Status | Existing | Scan Found | Details |
|----------|--------|----------|------------|---------|
| pause | Match | perm: `$self.owner` | perm: `$self.owner` | |
| mint | Differs | perm: `$self.admin` | perm: `$self.accessControl.MINTER_ROLE.members` | Owner path changed |
| setFee | New | (none) | perm: `$self.owner` | Not in existing data |
| transfer | Match | not perm | not perm | |
| oldFunc | Missing | perm: `$self.owner` | (not found in source) | May have been removed |

### Summary
- Matches: N (no action needed)
- New functions: N (would be added)
- Differences: N (would be updated)
- Missing from scan: N (needs investigation)
```

In compare mode, end by telling the user: "Run again without `--compare` to apply these changes."

---

## Guidelines

- **Verify before saving**: Every owner path expression must be checked against discovered.json. This is the core value of this skill over the old AI-prompt approach.
- **Be conservative**: When uncertain whether a function is permissioned, mark it as permissioned. False positives are better than false negatives for security analysis.
- **Respect researcher work**: Never overwrite functions marked `checked: true`.
- **Cross-reference freely**: When you see a reference to another contract (e.g., `accessControlManager`), look it up in discovered.json to understand its structure.
- **Report clearly**: The user needs to know which paths verified and which need manual attention.
- **No hallucinated paths**: Only construct paths using field names you have confirmed exist in discovered.json.
- **Handle proxies carefully**: Fields live on the proxy contract, not implementations. Use `$self.$admin` for proxy admin functions (not `$self.admin`).
