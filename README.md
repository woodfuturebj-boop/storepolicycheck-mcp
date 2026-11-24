# Read-Only MCP Server for Shopify GMC Audit (No Admin Write Access, No Credentials) — `storepolicycheck-mcp`

**Read-Only MCP Server for Shopify GMC Audit (No Admin Write Access, No Credentials)** — built for Claude Desktop, Claude Code, Cursor, Windsurf, and MCP-compatible AI agents.

`storepolicycheck-mcp` inspects **public Shopify storefront pages only** via [StorePolicyCheck](https://storepolicycheck.com) (`https://storepolicycheck.com`) — catching cross-page shipping & refund policy contradictions, `?variant=` JSON-LD Offer price mismatches, `robots.txt` blocks, and undersized product photos under Google's **January 31, 2027 500×500 px** rule with **zero Shopify Admin OAuth tokens and zero Google Merchant Center API credentials**.

---

## Why Read-Only? (`StorePolicyCheck MCP` vs. `ShopMCP` vs. `GMC Guard`)

| MCP Server | Credentials & Write Access | What It Inspects | License & Pricing |
| :--- | :--- | :--- | :--- |
| **`storepolicycheck-mcp`** ([storepolicycheck.com/mcp](https://storepolicycheck.com/mcp)) | **Zero credentials · 100% read-only** (no Shopify Admin write access, no GMC API OAuth) | Public storefront HTML, `/policies/*`, `/products.json` (up to 5,000 SKUs), `?variant=` JSON-LD & `/cart.js` — matching Google's external crawlers across **22 rules** | **MIT Open-Source · Free MCP tools** (optional $29 one-time web Pass — no monthly subscription required) |
| **ShopMCP** (`shop-mcp.app`) | Requires private Shopify Admin API token (often includes read/write store scopes) | Private Shopify Admin catalog/order CRUD prompts (does not diff public `/policies/*` quotes) | Commercial developer / SaaS tiers |
| **GMC Guard** (`gmcguard.ai`) | Requires private Google Merchant Center API OAuth connection | Private Merchant Center account/product status via Google API | Commercial SaaS plans |

Full 9-tool public pricing & permission matrix (including AdNabu, ClearCheck, ComplianceGuard AI $149 7-day pass vs. StorePolicyCheck $29 one-time pass, and ShieldKit): **[https://storepolicycheck.com/compare/shopify-gmc-audit-tools](https://storepolicycheck.com/compare/shopify-gmc-audit-tools)**

---

## Included Read-Only Tools

1. **`audit_shopify_store_gmc`** — Full 22-rule Shopify pre-review audit (US GA; UK/EU/CA/AU Beta) returning verbatim side-by-side page quotes and an interactive report URL.
2. **`check_shopify_500x500_images`** — Full-catalog sweep (up to 5,000 SKUs) for Google's **January 31, 2027 500×500 px** product image requirement (`https://support.google.com/merchants/answer/16989427`).
3. **`check_shopify_variant_jsonld_price`** — Compares visible `?variant=` buy-box price against `ProductGroup`/`Offer` structured data and flags bundle/subscription/currency app overrides (Kaching Bundles, Recharge, Seal, Bold, Transcy).
4. **`test_shopify_robots_txt`** — RFC 9309 check for `Googlebot`, `Storebot-Google`, `Googlebot-Image`, and AI search crawlers.

---

## 5-Line Setup (Claude Desktop / Cursor — Zero API Keys)

Add to `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "storepolicycheck": {
      "command": "npx",
      "args": ["-y", "github:woodfuturebj-boop/storepolicycheck-mcp"]
    }
  }
}
```

For ChatGPT Actions or HTTP agents, import the live OpenAPI 3.1 spec directly: `https://storepolicycheck.com/openapi.json`

---

## Plans & Honest Scope Boundary

- **Free Store Check ($0)**: All standalone diagnostic tools + 22-rule storefront preview revealing up to 2 full conflict evidence cards (`$0` if zero confirmed conflicts exist).
- **Single-Store Fix & Re-check Pass ($29 one-time per store, no monthly subscription required)**: Unlocks all remaining conflict evidence, copy-paste policy & Liquid patches, 5 live verification re-checks within 14 days, and a 30-day Continuous Guard trial.
- **Continuous Guard ($19/month or $190/year, cancel in one click)**: Daily 24-hour storefront and catalog drift monitoring.
- Independent diagnostic software not affiliated with Google LLC or Shopify Inc. Inspects public storefront data only; cannot view private Google Merchant Center identity/billing reviews and does not guarantee account reinstatement.
