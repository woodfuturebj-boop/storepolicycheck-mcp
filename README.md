# StorePolicyCheck MCP Server (`storepolicycheck-mcp`)

**Zero-credential, read-only Shopify Google Merchant Center (GMC) Misrepresentation & 500×500 Image Verifier for Claude Desktop, Cursor, Windsurf, and AI Agents.**

Unlike Shopify Admin MCP bridges that require private API tokens and OAuth scopes, `storepolicycheck-mcp` inspects **public storefront pages only** via [StorePolicyCheck](https://storepolicycheck.com) (`https://storepolicycheck.com`)—catching the exact cross-page policy, variant JSON-LD price, plugin, and image contradictions Google's crawlers see.

## Included Tools
1. **`audit_shopify_store_gmc`** — Full 15-rule US/USD Shopify pre-review audit (verbatim shipping/return contradictions, variant JSON-LD price parity, 8-family plugin fingerprinting, prohibited claims, 500×500 sweep) + clickable interactive report URL.
2. **`check_shopify_500x500_images`** — Free 250-SKU sweep for Google's **January 31, 2027 500×500 px** product image requirement.
3. **`check_shopify_variant_jsonld_price`** — Compares visible `?variant=` buy-box price against `ProductGroup`/`Offer` JSON-LD and detects bundle/subscription/currency apps (Recharge, Seal, Kaching Bundles, Transcy, PageFly, etc.).
4. **`test_shopify_robots_txt`** — RFC 9309 check for `Googlebot`, `Storebot-Google`, `Googlebot-Image`, and AI search crawlers.

## Quick Setup (Claude Desktop / Cursor)
Add to your MCP config (`claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "storepolicycheck": {
      "command": "npx",
      "args": ["-y", "storepolicycheck-mcp"]
    }
  }
}
```

## Pricing & Scope Boundary
- **Free**: All 4 standalone diagnostic tools + full preview showing up to 2 verbatim conflict pairs (`$0` if zero hard conflicts exist).
- **$29 one-time pass** (optional, per store, 14 days, no subscription): Unlocks all conflicts, copy-paste Shopify policy patches, GMC backend settings mirror table, and 5 automated before-and-after verification re-scans.
- Independent tool not affiliated with Google LLC or Shopify Inc. OpenAPI spec: `https://storepolicycheck.com/openapi.json`.

## Video Walkthrough & Ecosystem Links
- **1080p HD Walkthrough (YouTube `@storepolicycheck`):** https://youtu.be/P1ZFbBqXJH8
- **Official X / Twitter (`@StorePolicyHQ`):** https://x.com/StorePolicyHQ
- **Official Zero-Login Web Scanner (15 Rules):** https://storepolicycheck.com
- **2026 8-Tool Comparison Matrix:** https://storepolicycheck.com/compare/shopify-gmc-audit-tools
- **GMC Red-Banner Error-Code Glossary:** https://storepolicycheck.com/gmc-errors
- **中文出海卖家免绑后台自检全攻略 (GitHub):** https://github.com/woodfuturebj-boop/shopify-gmc-shensu-zicha-2026
