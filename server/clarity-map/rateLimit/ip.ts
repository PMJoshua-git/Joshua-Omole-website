import crypto from 'node:crypto';
import net from 'node:net';

export interface RateLimitRequestLike {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string | undefined };
  connection?: { remoteAddress?: string | undefined };
}

function firstHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  return typeof str === 'string' && str.trim() !== '' ? str.trim() : null;
}

function stripPortAndBrackets(raw: string): string {
  let value = raw.trim();
  if (!value) return '';

  // Remove IPv6 zone identifier if present (e.g. fe80::1%eth0)
  const zoneIdx = value.indexOf('%');
  if (zoneIdx !== -1) {
    value = value.slice(0, zoneIdx);
  }

  // Bracketed IPv6, optionally with :port -> [2001:db8::1]:443
  if (value.startsWith('[')) {
    const closeBracket = value.indexOf(']');
    if (closeBracket !== -1) {
      return value.slice(1, closeBracket);
    }
  }

  // Dotted IPv4 with :port -> 203.0.113.5:54321
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) {
    return value.slice(0, value.lastIndexOf(':'));
  }

  return value;
}

function expandIpv6(address: string): number[] | null {
  let addr = address.toLowerCase();

  // Handle embedded IPv4 tail (e.g., ::ffff:192.0.2.128)
  const lastColon = addr.lastIndexOf(':');
  if (lastColon !== -1 && addr.slice(lastColon + 1).includes('.')) {
    const ipv4Part = addr.slice(lastColon + 1);
    if (net.isIP(ipv4Part) !== 4) return null;
    const octets = ipv4Part.split('.').map((n) => Number.parseInt(n, 10));
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    addr = `${addr.slice(0, lastColon)}:${high}:${low}`;
  }

  const parts = addr.split('::');
  if (parts.length > 2) return null;

  const left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(':').filter(Boolean) : [];

  if (parts.length === 1 && left.length !== 8) return null;
  if (parts.length === 2 && left.length + right.length >= 8) return null;

  const missing = parts.length === 2 ? 8 - (left.length + right.length) : 0;
  const full = [
    ...left,
    ...Array(missing).fill('0'),
    ...right,
  ];

  if (full.length !== 8) return null;

  const hextets: number[] = [];
  for (const hex of full) {
    if (!/^[0-9a-f]{1,4}$/.test(hex)) return null;
    hextets.push(Number.parseInt(hex, 16));
  }
  return hextets;
}

/**
 * Normalizes a raw IP string:
 * - strips ports and brackets
 * - converts IPv4-mapped IPv6 (::ffff:1.2.3.4 or ::ffff:0102:0304) to IPv4
 * - truncates IPv6 to its canonical /64 prefix
 * Returns null if the value is not a valid IP address.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const candidate = stripPortAndBrackets(raw);
  if (!candidate) return null;

  const ipVersion = net.isIP(candidate);
  if (ipVersion === 4) {
    return candidate;
  }

  if (ipVersion === 6) {
    const hextets = expandIpv6(candidate);
    if (!hextets) return null;

    // Detect IPv4-mapped IPv6 (::ffff:w.x.y.z)
    const isIpv4Mapped =
      hextets[0] === 0 &&
      hextets[1] === 0 &&
      hextets[2] === 0 &&
      hextets[3] === 0 &&
      hextets[4] === 0 &&
      hextets[5] === 0xffff;

    if (isIpv4Mapped) {
      const a = (hextets[6] >> 8) & 0xff;
      const b = hextets[6] & 0xff;
      const c = (hextets[7] >> 8) & 0xff;
      const d = hextets[7] & 0xff;
      return `${a}.${b}.${c}.${d}`;
    }

    // Reduce IPv6 to /64 prefix so a visitor cannot rotate addresses inside their /64
    const prefix = hextets
      .slice(0, 4)
      .map((h) => h.toString(16).padStart(4, '0'))
      .join(':');
    return `${prefix}::/64`;
  }

  return null;
}

/**
 * Checks whether a raw IP represents a loopback address before /64 truncation
 * (so ::1 matches loopback while ::2 does not).
 */
export function isLoopbackIp(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const candidate = stripPortAndBrackets(raw);
  if (!candidate) return false;

  if (net.isIP(candidate) === 4) {
    return candidate.startsWith('127.');
  }
  if (net.isIP(candidate) === 6) {
    const hextets = expandIpv6(candidate);
    if (!hextets) return false;
    // ::1
    const isIpv6Loopback =
      hextets[0] === 0 &&
      hextets[1] === 0 &&
      hextets[2] === 0 &&
      hextets[3] === 0 &&
      hextets[4] === 0 &&
      hextets[5] === 0 &&
      hextets[6] === 0 &&
      hextets[7] === 1;
    if (isIpv6Loopback) return true;
    // ::ffff:127.0.0.1
    const isMappedLoopback =
      hextets[0] === 0 &&
      hextets[1] === 0 &&
      hextets[2] === 0 &&
      hextets[3] === 0 &&
      hextets[4] === 0 &&
      hextets[5] === 0xffff &&
      ((hextets[6] >> 8) & 0xff) === 127;
    return isMappedLoopback;
  }
  return false;
}

/**
 * Extracts raw client IP respecting trusted proxy configuration.
 * - On Vercel / behind trusted Express proxy: prefers `x-vercel-forwarded-for`,
 *   then first hop of `x-forwarded-for`, then `x-real-ip`, then `req.ip` / socket address.
 * - Without trusted proxy: ignores spoofable forwarded headers and reads socket address.
 */
export function extractRawClientIp(
  req: RateLimitRequestLike,
  options: { trustProxy?: boolean } = {}
): string | null {
  const trustProxy = Boolean(options.trustProxy);

  if (trustProxy) {
    const vercelHeader = firstHeaderValue(req.headers, 'x-vercel-forwarded-for');
    if (vercelHeader) {
      const first = vercelHeader.split(',')[0]?.trim();
      if (first && normalizeIp(first)) return first;
    }

    const xffHeader = firstHeaderValue(req.headers, 'x-forwarded-for');
    if (xffHeader) {
      const first = xffHeader.split(',')[0]?.trim();
      if (first && normalizeIp(first)) return first;
    }

    const realIp = firstHeaderValue(req.headers, 'x-real-ip');
    if (realIp && normalizeIp(realIp)) {
      return realIp;
    }

    if (req.ip && normalizeIp(req.ip)) {
      return req.ip;
    }
  }

  const socketAddr = req.socket?.remoteAddress || req.connection?.remoteAddress || null;
  if (socketAddr && normalizeIp(socketAddr)) {
    return socketAddr;
  }

  if (!trustProxy && req.ip && normalizeIp(req.ip)) {
    return req.ip;
  }

  return null;
}

export interface ClientIdentity {
  normalizedIp: string | null;
  isUnknown: boolean;
  isLocalhost: boolean;
  hashHex: string;
  redisKey: string;
}

export function hashIdentity(identity: string, secret: string): { hashHex: string; redisKey: string } {
  const hashHex = crypto
    .createHmac('sha256', secret)
    .update(identity)
    .digest('hex');
  return {
    hashHex,
    redisKey: `gen:${hashHex}`,
  };
}

export function resolveClientIdentity(
  req: RateLimitRequestLike,
  options: { secret: string; trustProxy?: boolean }
): ClientIdentity {
  const rawIp = extractRawClientIp(req, { trustProxy: options.trustProxy });
  const normalizedIp = normalizeIp(rawIp);
  const isUnknown = normalizedIp === null;
  const isLocalhost = isLoopbackIp(rawIp);
  const identityValue = normalizedIp ?? 'unknown';
  const { hashHex, redisKey } = hashIdentity(identityValue, options.secret);

  return {
    normalizedIp,
    isUnknown,
    isLocalhost,
    hashHex,
    redisKey,
  };
}
