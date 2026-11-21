#!/usr/bin/env node
/**
 * StorePolicyCheck MCP Server v2.0.0 (Zero-Credential Multi-Market Shopify GMC Verifier)
 * Protocol: Model Context Protocol (JSON-RPC 2.0 over stdio)
 * Docs: https://storepolicycheck.com/openapi.json
 */
import readline from 'node:readline';

const BASE_URL = (process.env.STOREPOLICYCHECK_API_URL || 'https://storepolicycheck.com').replace(
  /\/+$/,
  ''
);

const TOOLS = [
  {
    name: 'audit_shopify_store_gmc',
    description:
      'Run a zero-credential, read-only 22-rule Shopify storefront audit across US, UK, EU, CA & AU for Google Merchant Center (GMC) Misrepresentation triggers (cross-page shipping/return contradictions, UK/EU 14-day statutory return minimums, /cart/add.js sneak fees, DNS MX email deliverability, ICANN RDAP domain age, virtual-office addresses, variant JSON-LD price parity, and 500x500 images).',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: {
          type: 'string',
          description: 'Public Shopify storefront or product URL (US, UK, EU, CA, or AU)',
        },
        stage: {
          type: 'string',
          enum: ['pre_launch', 'warning', 'suspended', 'item_disapproved'],
          description: 'Current GMC review stage (defaults to suspended)',
        },
      },
    },
  },
  {
    name: 'check_gmc_feed_vs_storefront',
    description:
      'Compare a Google Merchant Center TSV, CSV, or XML product feed against a live public Shopify storefront catalog to detect price mismatches, out-of-stock drift, 404 dead handles, and GTIN errors.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl', 'feedContent'],
      properties: {
        storeUrl: { type: 'string', description: 'Public Shopify store domain or URL' },
        feedContent: { type: 'string', description: 'Raw TSV, CSV, or Google Shopping XML feed text' },
      },
    },
  },
  {
    name: 'check_shopify_entity_email_and_cart_trust',
    description:
      'Audit shell-company & checkout trust triggers: DNS MX support email deliverability, ICANN RDAP domain age vs. founding claims, shared virtual-office addresses (30 N Gould St, 8 The Green, 71-75 Shelton St), cross-page street address conflicts, and /cart/add.js auto-injected sneak fees.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: { type: 'string', description: 'Public Shopify storefront domain or URL' },
      },
    },
  },
  {
    name: 'check_shopify_gmc_catalog_hygiene',
    description:
      'Scan up to 250 public Shopify SKUs for GMC title promotional spam (FREE SHIPPING, ALL-CAPS), storewide perpetual strikethrough sales, 0g shipping weights, and GTIN/identifier_exists hygiene.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: { type: 'string', description: 'Public Shopify storefront domain or URL' },
      },
    },
  },
  {
    name: 'check_shopify_500x500_images',
    description:
      'Sweep up to 250 public Shopify products against Google Merchant Center Jan 31, 2027 500x500 px minimum image enforcement.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: { type: 'string', description: 'Public Shopify store domain or URL' },
      },
    },
  },
  {
    name: 'check_shopify_variant_jsonld_price',
    description:
      'Compare a Shopify product ?variant= visible buy-box price against ProductGroup/Offer JSON-LD schema across USD, GBP, EUR, CAD & AUD, and fingerprint conflicting bundle/subscription/currency plugins.',
    inputSchema: {
      type: 'object',
      required: ['productUrl'],
      properties: {
        productUrl: {
          type: 'string',
          description: 'Full public Shopify product URL (optionally including ?variant=ID)',
        },
      },
    },
  },
  {
    name: 'test_shopify_robots_txt',
    description:
      'Evaluate a Shopify store robots.txt per RFC 9309 for Googlebot, Storebot-Google, Googlebot-Image, and AI crawlers.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: { type: 'string', description: 'Public Shopify storefront domain or URL' },
      },
    },
  },
];

async function callApi(endpoint, payload) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'storepolicycheck-mcp/2.0.0',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

async function executeTool(name, args) {
  if (name === 'audit_shopify_store_gmc') {
    const scan = await callApi('/api/scan', {
      inputUrl: String(args?.storeUrl || '').trim(),
      stage: args?.stage || 'suspended',
      merchantInput: {},
      sourceGeoSlug: 'mcp-server',
      utmSource: 'storepolicycheck-mcp',
      referrer: 'https://npmjs.com/package/storepolicycheck-mcp',
    });
    const reportRes = await fetch(`${BASE_URL}/api/scan/${scan.operatorToken}`, {
      headers: { 'User-Agent': 'storepolicycheck-mcp/2.0.0' },
    });
    const report = reportRes.ok ? await reportRes.json() : null;
    const reportUrl = `${BASE_URL}/report/${scan.operatorToken}`;
    return {
      reportUrl,
      shareUrl: `${BASE_URL}/share/${scan.shareToken}`,
      market: report?.market || 'US',
      currency: report?.currency || 'USD',
      supportStatus: report?.supportStatus || 'unknown',
      counts: report?.counts || null,
      freePreviewFindings: (report?.findings || [])
        .filter((f) => f.isFreePreviewUnlocked || f.state === 'needs_confirmation')
        .slice(0, 6)
        .map((f) => ({
          ruleCode: f.ruleCode,
          state: f.state,
          title: f.titleEn,
          primaryEvidence: f.primaryEvidence?.quote || null,
          secondaryEvidence: f.secondaryEvidence?.quote || null,
        })),
      nextStep:
        'Open reportUrl to inspect verbatim quotes, 5-country policy & 3PL patches, drop-in Shopify Liquid ProductGroup code, GMC Supplemental Feed TSV auto-cleaning, Appeal Evidence log, and 5 post-edit re-scans.',
    };
  }

  if (name === 'check_gmc_feed_vs_storefront') {
    const data = await callApi('/api/tools/feed-parity-check', {
      inputUrl: String(args?.storeUrl || '').trim(),
      feedContent: String(args?.feedContent || '').trim(),
    });
    return {
      ...data,
      webToolUrl: `${BASE_URL}/tools/gmc-feed-vs-storefront-matcher?utm_source=storepolicycheck-mcp`,
    };
  }

  if (name === 'check_shopify_entity_email_and_cart_trust') {
    const data = await callApi('/api/tools/trust-check', {
      inputUrl: String(args?.storeUrl || '').trim(),
    });
    return {
      ...data,
      webToolUrl: `${BASE_URL}/tools/shopify-trust-email-address-checker?utm_source=storepolicycheck-mcp`,
    };
  }

  if (name === 'check_shopify_gmc_catalog_hygiene') {
    const data = await callApi('/api/tools/catalog-hygiene-check', {
      inputUrl: String(args?.storeUrl || '').trim(),
    });
    return {
      ...data,
      webToolUrl: `${BASE_URL}/tools/gmc-product-title-gtin-cleaner?utm_source=storepolicycheck-mcp`,
    };
  }

  if (name === 'check_shopify_500x500_images') {
    const data = await callApi('/api/tools/image-check', {
      inputUrl: String(args?.storeUrl || '').trim(),
    });
    return {
      ...data,
      webToolUrl: `${BASE_URL}/tools/gmc-image-size-checker?utm_source=storepolicycheck-mcp`,
    };
  }

  if (name === 'check_shopify_variant_jsonld_price') {
    const data = await callApi('/api/tools/variant-price-check', {
      inputUrl: String(args?.productUrl || '').trim(),
    });
    return {
      ...data,
      webToolUrl: `${BASE_URL}/tools/shopify-variant-json-ld-price-checker?utm_source=storepolicycheck-mcp`,
    };
  }

  if (name === 'test_shopify_robots_txt') {
    const data = await callApi('/api/tools/robots-check', {
      inputUrl: String(args?.storeUrl || '').trim(),
    });
    return {
      ...data,
      webToolUrl: `${BASE_URL}/tools/shopify-robots-txt-googlebot-tester?utm_source=storepolicycheck-mcp`,
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch {
    return;
  }

  const { id, method, params } = req;

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'storepolicycheck-mcp',
          version: '2.0.0',
        },
      },
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    send({
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    });
    return;
  }

  if (method === 'tools/call') {
    try {
      const result = await executeTool(params?.name, params?.arguments || {});
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      });
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `StorePolicyCheck error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        },
      });
    }
    return;
  }

  if (id !== undefined) {
    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
});
