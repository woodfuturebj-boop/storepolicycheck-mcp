#!/usr/bin/env node
/**
 * StorePolicyCheck MCP Server (Zero-Credential Public Read-Only Shopify GMC Verifier)
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
      'Run a zero-credential, read-only 15-rule Shopify US/USD storefront audit for Google Merchant Center (GMC) Misrepresentation triggers (cross-page shipping/return contradictions, variant JSON-LD price parity, plugin fingerprints, prohibited claims, and 500x500 images). Returns a clickable report link with free preview findings.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: {
          type: 'string',
          description: 'Public Shopify storefront or product URL (e.g., https://example-store.com)',
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
    name: 'check_shopify_500x500_images',
    description:
      'Sweep up to 250 public Shopify products against Google Merchant Center Jan 31, 2027 500x500 px minimum image enforcement.',
    inputSchema: {
      type: 'object',
      required: ['storeUrl'],
      properties: {
        storeUrl: {
          type: 'string',
          description: 'Public Shopify store domain or URL',
        },
      },
    },
  },
  {
    name: 'check_shopify_variant_jsonld_price',
    description:
      'Compare a Shopify product ?variant= visible buy-box price against ProductGroup/Offer JSON-LD schema and fingerprint conflicting bundle/subscription/currency plugins.',
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
        storeUrl: {
          type: 'string',
          description: 'Public Shopify storefront domain or URL',
        },
      },
    },
  },
];

async function callApi(endpoint, payload) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'storepolicycheck-mcp/1.0.0',
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
      headers: { 'User-Agent': 'storepolicycheck-mcp/1.0.0' },
    });
    const report = reportRes.ok ? await reportRes.json() : null;
    const reportUrl = `${BASE_URL}/report/${scan.operatorToken}`;
    return {
      reportUrl,
      shareUrl: `${BASE_URL}/share/${scan.shareToken}`,
      supportStatus: report?.supportStatus || 'unknown',
      counts: report?.counts || null,
      freePreviewFindings: (report?.findings || [])
        .filter((f) => f.isFreePreviewUnlocked || f.state === 'needs_confirmation')
        .slice(0, 5)
        .map((f) => ({
          ruleCode: f.ruleCode,
          state: f.state,
          title: f.titleEn,
          primaryEvidence: f.primaryEvidence?.quote || null,
          secondaryEvidence: f.secondaryEvidence?.quote || null,
        })),
      nextStep:
        'Open reportUrl to inspect verbatim quotes, copy-paste Shopify policy patches, GMC settings mirror table, and 5 automated post-edit verification re-scans.',
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
          version: '1.0.0',
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
