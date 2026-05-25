import { Scenario } from '@akira/schema';
import type { Scenario as ScenarioType } from '@akira/schema';

const FRAGMENT_KEY = 'share';

function uint8ToBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice((b64.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzipString(s: string): Promise<Uint8Array> {
  const stream = new Blob([s]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function gunzipString(bytes: Uint8Array): Promise<string> {
  const blob = new Blob([bytes as BlobPart]);
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

export async function buildShareUrl(
  scenario: ScenarioType,
  origin = window.location.origin,
): Promise<string> {
  const json = JSON.stringify(scenario);
  const bytes = await gzipString(json);
  const encoded = uint8ToBase64Url(bytes);
  return `${origin}/#${FRAGMENT_KEY}=${encoded}`;
}

export async function decodeShareFragment(fragment: string): Promise<ScenarioType | null> {
  // Accept either "share=..." or "#share=..." or the raw payload.
  const cleaned = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  const match = /(?:^|[&;])share=([^&;]+)/.exec(cleaned);
  if (!match || !match[1]) return null;
  const bytes = base64UrlToUint8(match[1]);
  const json = await gunzipString(bytes);
  return Scenario.parse(JSON.parse(json));
}

export function clearShareFragment(): void {
  // Strip the fragment so a reload doesn't re-import.
  if (window.location.hash.includes(`${FRAGMENT_KEY}=`)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
