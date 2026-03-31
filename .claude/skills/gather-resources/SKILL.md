---
name: gather-resources
description: Gather official resources (website, frontends, docs, GitHub, X, licenses, DeFiScan V1) and security audits for a DeFi protocol. Starts from a URL, searches the web, verifies links, and saves to resources.json. Supports --audits-only mode to gather only audits using existing resources as a starting point.
argument-hint: "[project-name] [initial-url] [--audits-only]"
allowed-tools: Bash, Read, Write, WebSearch, WebFetch
---

# Gather Resources Agent

You are a DeFi protocol resource collector. Your task is to discover and collect official resources and/or security audits for the project **$0**.

**Mode detection**: Check if any argument (`$1` or `$2`) equals `--audits-only`. If so, run in **audits-only mode** — skip Steps 1–3 and go straight to Step 0 → Step A → Steps 4–6. The initial URL is `$1` if it does not start with `--`, otherwise it is empty (you will derive starting points from existing resources).

## Prerequisites

The l2b UI server must be running at `http://localhost:2021`. If not, tell the user to start it with `cd packages/config && l2b ui`.

---

## Step 0: Load Existing Resources and Audits

Fetch what already exists so you can merge later and use as starting points.

```bash
curl -s localhost:2021/api/projects/$0/resources > /tmp/gather-existing-resources.json
curl -s localhost:2021/api/projects/$0/audits > /tmp/gather-existing-audits.json
```

Read both files:
- If `resources` contains a non-empty array, note which URLs are already present (you will preserve them and only add new ones). Also note the **website URL**, **GitHub URL(s)**, and **docs URL** from existing resources — these are your starting points for audit discovery.
- If `audits` contains a non-empty array, note which audit URLs are already present (same deduplication rule).

---

## Step 1: Crawl the Initial URL

*(Skip this step in audits-only mode)*

Use **WebFetch** on `$1` to load the initial page. Extract all links from the page content. Look specifically for:

- Navigation links (header, footer) pointing to docs, blog, governance, app, etc.
- Social media links (Twitter/X, Discord, Telegram, etc.)
- GitHub links
- Links to other frontends or interfaces

Record every potentially useful URL you find.

---

## Step 2: Web Search for Additional Resources

*(Skip this step in audits-only mode)*

Use **WebSearch** to find resources that may not be linked from the initial page. Run these searches (adapt the protocol name from `$0`, converting hyphens to spaces and capitalizing):

1. `"<protocol name>" site:github.com` — find GitHub repos
2. `"<protocol name>" site:x.com OR site:twitter.com` — find X/Twitter account
3. `"<protocol name>" DeFi documentation docs` — find documentation
4. `"<protocol name>" DeFi app frontend interface` — find frontends (official and third-party like DeFi Saver, Instadapp, etc.)
5. `"<protocol name>" site:defiscan.info` — find DeFiScan V1 report

For each search, evaluate results carefully. Only use results that clearly belong to the correct protocol — watch out for name collisions with unrelated projects.

---

## Step 3: Verify and Classify Each Resource URL

*(Skip this step in audits-only mode)*

For every candidate URL, use **WebFetch** to verify it is accessible (returns HTTP 200). Discard any URL that returns an error or redirects to an unrelated page.

Classify each verified URL into one of these types:

### Website (`type: "website"`)
- The protocol's main marketing/landing page (e.g., `compound.finance`, `liquity.org`)
- Usually NOT the app — it describes what the protocol is
- There should be exactly **one** website entry

### Frontend (`type: "frontend"`)
- Web applications where users interact with the protocol (deposit, borrow, swap, etc.)
- Classify `frontendSubtype`:
  - `"official"` — hosted by the protocol team on their domain (e.g., `app.compound.finance`)
  - `"third-party"` — hosted by another team (e.g., `app.defisaver.com/liquityV2/`)
  - `"self-hosted"` — open source interface users can run themselves (link to GitHub repo with build instructions, or IPFS releases)
- Include a `label` for non-obvious frontends (e.g., `"IPFS Instructions"`, `"IPFS Releases"`)
- **Key distinction for "immutable" / "fork-friendly" protocols**: If a protocol is designed so that anyone can deploy a frontend (like Liquity V2 or Uniswap), most frontends are `"third-party"`. Only classify as `"official"` if the protocol team themselves hosts it.

### Documentation (`type: "docs"`)
- Official technical documentation (e.g., `docs.compound.finance`)
- NOT blog posts, NOT marketing pages

### GitHub (`type: "github"`)
- The protocol's main GitHub organization or primary smart contract repository
- Prefer the org URL if it exists (e.g., `github.com/compound-finance`)
- If no org, use the main contract repo (e.g., `github.com/liquity/bold`)
- Only one or two entries — do NOT list every repo

### X/Twitter (`type: "x"`)
- The protocol's official X/Twitter account
- URL format: `https://x.com/<handle>` (use x.com, not twitter.com)
- Exactly **one** entry

### License (`type: "license"`)
- **CRITICAL**: Must link to the **actual license text**, not just a mention of a license
- Valid sources:
  - A LICENSE file on GitHub (e.g., `https://github.com/org/repo/blob/main/LICENSE`)
  - A dedicated license page on the protocol's website
  - Any URL that displays the full license terms
- Invalid: A blog post saying "we use MIT license", or a README that mentions the license
- To find licenses:
  1. Go to the GitHub repo(s) found above
  2. Use **WebFetch** on the repo page and look for a license badge/link
  3. Try fetching common paths: `blob/main/LICENSE`, `blob/master/LICENSE`, `blob/main/LICENSE.md`, `blob/main/LICENSE.txt`, `blob/main/COPYING`
  4. Also check the protocol's website footer for license/legal pages
- Set `label` to the SPDX license identifier: `"MIT"`, `"GPL-3.0"`, `"BUSL-1.1"`, `"Apache-2.0"`, etc.
- Set `licenseScope` to describe what the license covers: `"Contracts"`, `"Frontend"`, `"SDK"`, `"Contracts & UI"`, etc.
- If the protocol has multiple repos with different licenses (e.g., contracts under BUSL-1.1, frontend under MIT), create **separate** license entries for each

### DeFiScan V1 (`type: "defiscan-v1"`)
- URL format: `https://www.defiscan.info/protocols/<project-slug>/ethereum`
- Use **WebFetch** to verify this URL exists (DeFiScan V1 may not have a report for every protocol)
- The project slug is usually `$0` but may differ — check search results

### Source Code (`type: "source-code"`)
- Only if separate from the GitHub entry (e.g., an Etherscan verified source link)
- Rarely needed

### Other (`type: "other"`)
- Use sparingly for governance forums, block explorers, or other useful official links
- Include a descriptive `label`

---

## Step A: Gather Security Audits

*(Run in both normal mode and audits-only mode)*

Security audits are stored separately as `AuditEntry[]` with fields: `url`, `author`, `date`, `scope?`.

### Starting points for audit discovery

Use the following as entry points (from existing resources loaded in Step 0, or from resources found in Steps 1–3):
- **GitHub org/repo URL** — check for an `/audits/`, `/security/`, or `/docs/security/` directory
- **Website URL** — look for a security or audits page
- **Docs URL** — look for a security section

### Discovery steps

1. **GitHub audit directory**: For each known GitHub URL (e.g., `https://github.com/compound-finance`):
   - Use WebFetch on `<github-url>` to scan the page for links to audit files or audit directories
   - Try fetching: `<repo>/tree/main/audits`, `<repo>/tree/main/security`, `<repo>/tree/main/docs/security`, `<repo>/tree/main/docs/audits`
   - If an audits directory is found, fetch it and collect individual audit file links (PDF, MD, or external report pages)

2. **Website/docs security page**: Use WebFetch on the known website and docs URLs. Look for a "Security", "Audits", or "Bug Bounty" section in the navigation or footer. If found, fetch the linked page and collect audit report URLs.

3. **Web search**: Run these searches:
   - `"<protocol name>" security audit report`
   - `"<protocol name>" audit github`
   - Evaluate results — only use links that originate from the **protocol's own GitHub org or official website**. Do NOT use third-party listing sites (e.g., DeFiYield, Rekt, audit aggregators) as the primary source. If a third-party site lists an audit, try to find the original link from the protocol's own sources.

### For each found audit

1. **Verify the URL** via WebFetch — it must be accessible (HTTP 200)
2. **Verify it is official** — the URL must be from:
   - The protocol's own GitHub organization (e.g., `github.com/<protocol-org>/...`)
   - The protocol's own website or docs domain
   - The auditing firm's website (e.g., `blog.openzeppelin.com`, `reports.trail-of-bits.com`) — these are acceptable as the official source when the protocol links to them
3. **Extract metadata** from the file/page:
   - `author`: the name of the auditing firm (e.g., `"Trail of Bits"`, `"OpenZeppelin"`, `"ChainSecurity"`)
   - `date`: the audit date in `"YYYY-MM"` or `"YYYY-MM-DD"` format — look in the filename, report header, or GitHub commit date
   - `scope`: optional short description of what was audited (e.g., `"Core contracts"`, `"Staking module"`, `"v2 upgrade"`) — extract from the report title or introduction. **Keep it brief: 2–5 words max.** Do not include the firm name, protocol name, or methodology notes like "(formal verification)".
4. **Deduplicate** against existing audits (by URL, case-insensitive)

### Bug Bounty Program

After collecting audit reports, search for an active bug bounty program:

1. Web search: `"<protocol name>" bug bounty Immunefi` and `"<protocol name>" bug bounty HackerOne`
2. Check the protocol's website/docs for a "Security" or "Bug Bounty" page — often linked in the footer or security section
3. If a program is found:
   - Verify the page is accessible (HTTP 200) and belongs to this protocol
   - Extract the **maximum bounty amount** in USD (look for "up to $X" or "maximum reward" language)
   - Always create a **new dedicated entry**: `{ author: "<platform name>", scope: "Bug Bounty Program", date: "<program launch date or current year>", url: "<bounty program URL>", bounty: <max_amount> }`
   - `author` is the platform hosting the program (e.g. `"Immunefi"`, `"HackerOne"`)
   - `bounty` is a plain number in USD (e.g. `500000` for $500K, `1000000` for $1M) — no formatting, no $ sign
   - Do NOT add `bounty` to existing audit entries

### Audit quality checks

Before saving, verify:
- Every audit entry has `author` and `date` (required fields)
- Every `url` has been fetched and confirmed accessible
- No duplicate URLs
- All URLs come from official sources

---

## Step 4: Build the Final Resource List

*(Skip resource list building in audits-only mode — only save audits)*

### Merge Rules (resources)

1. Start with all existing resources (from Step 0)
2. For each new resource you found:
   - If an existing entry has the **same URL** (case-insensitive match), skip it (keep the existing entry)
   - If an existing entry has the **same type AND same URL domain+path** but different query params, skip it
   - Otherwise, add the new entry
3. Sort the final list by type in this order: `website`, `frontend`, `docs`, `github`, `x`, `source-code`, `license`, `defiscan-v1`, `other`

### Quality Checks (resources)

Before saving, verify:
- Every URL has been fetched and confirmed accessible
- No duplicate URLs
- At most one `website` entry
- At most one `x` entry
- License entries link to actual license text (not mentions)
- License entries have both `label` and `licenseScope`
- Frontend entries have `frontendSubtype` set
- No URLs from unrelated protocols

---

## Step 5: Save via API

**Resources** (skip in audits-only mode):

Write the final resources JSON array to `/tmp/gather-final-resources.json` using the Write tool, then save:

```bash
curl -s -X PUT localhost:2021/api/projects/$0/resources \
  -H "Content-Type: application/json" \
  -d @/tmp/gather-final-resources.json
```

**Audits** (always):

Write the final audits JSON array to `/tmp/gather-final-audits.json` using the Write tool, then save:

```bash
curl -s -X PUT localhost:2021/api/projects/$0/audits \
  -H "Content-Type: application/json" \
  -d @/tmp/gather-final-audits.json
```

Clean up:

```bash
rm -f /tmp/gather-existing-resources.json /tmp/gather-existing-audits.json \
       /tmp/gather-final-resources.json /tmp/gather-final-audits.json
```

---

## Step 6: Report

Print a summary:
- Total resources saved (new + existing) — skip in audits-only mode
- Total audits saved (new + existing)
- How many resources/audits were newly added vs already present
- List each new resource with its type and URL
- List each new audit with author, date, scope, and URL
- Note any resource types that are missing (e.g., "No documentation URL found", "No license found")
- Note if no audits were found and where you looked
- If you could not verify a potentially useful URL, mention it so the user can check manually

---

## Guidelines

- **Never hallucinate URLs** — every URL must be verified via WebFetch before inclusion
- **Be conservative** — when uncertain whether a resource belongs to this protocol, skip it
- **Rely on official sources** — protocol team websites over aggregator listings
- **Use x.com** not twitter.com for X/Twitter URLs
- **No trailing spaces** in URLs
- **No emojis** in labels or output
- **Include third-party frontends** (DeFi Saver, Instadapp, etc.) — flag them as `"third-party"` subtype
- **Audits-only mode**: use existing resources (website, GitHub, docs) as starting points — do not re-gather or overwrite resources