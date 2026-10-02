/**
 * Pure, synchronous MD5 hex digest. Neither `SubtleCrypto` nor Node's
 * `crypto` module offer a synchronous digest in the browser, so this exists
 * purely to let slug generation derive a deterministic fallback in-process.
 * Mirrors Postgres' built-in `md5()` (see the `slugify` migration) and the
 * copy in `supabase/functions/diff-schedule/helpers.ts` — keep all three in
 * sync byte-for-byte.
 */
export function md5(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLenLow = (bytes.length * 8) >>> 0;
  const bitLenHigh = Math.floor((bytes.length * 8) / 2 ** 32) >>> 0;

  const withOneLen = bytes.length + 1;
  const padLen = (56 - (withOneLen % 64) + 64) % 64;
  const totalLen = withOneLen + padLen + 8;
  const msg = new Uint8Array(totalLen);
  msg.set(bytes, 0);
  msg[bytes.length] = 0x80;

  const view = new DataView(msg.buffer);
  view.setUint32(totalLen - 8, bitLenLow, true);
  view.setUint32(totalLen - 4, bitLenHigh, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < totalLen; chunkStart += 64) {
    const M = new Int32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getInt32(chunkStart + j * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      f = addUnsigned32(addUnsigned32(addUnsigned32(f, a), MD5_K[i]), M[g]);
      a = d;
      d = c;
      c = b;
      b = addUnsigned32(b, rotateLeft(f, MD5_SHIFTS[i]));
    }

    a0 = addUnsigned32(a0, a);
    b0 = addUnsigned32(b0, b);
    c0 = addUnsigned32(c0, c);
    d0 = addUnsigned32(d0, d);
  }

  return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
}

function rotateLeft(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c));
}

function addUnsigned32(a: number, b: number): number {
  return (a + b) | 0;
}

function toHexLE(n: number): string {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setInt32(0, n, true);
  return Array.from(out)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

const MD5_K = new Int32Array([
  -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426,
  -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162,
  1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
  643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
  568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784,
  1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
  -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222,
  -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
  -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
  -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649,
  -145523070, -1120210379, 718787259, -343485551,
]);
