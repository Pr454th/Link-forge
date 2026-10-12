import { randomBytes, randomUUID } from 'node:crypto';

export function createLinkStore({ baseUrl }) {
  const linksByCode = new Map();
  function getAvailableCode() {
    let code;
    do {
      code = randomBytes(4).toString('base64url');
    } while (linksByCode.has(code));
    return code;
  }

  return {
    list() {
      return [...linksByCode.values()].map((link) => ({ ...link }));
    },
    get(shortCode) {
      const link = linksByCode.get(shortCode);
      return link ? { ...link } : undefined;
    },
    create(originalUrl, customCode) {
      const shortCode = customCode || getAvailableCode();
      if (linksByCode.has(shortCode)) return undefined;

      const link = {
        id: randomUUID(),
        originalUrl,
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };
      linksByCode.set(shortCode, link);
      return { ...link };
    },
    recordClick(shortCode) {
      const link = linksByCode.get(shortCode);
      if (!link) return undefined;
      link.clicks += 1;
      return { ...link };
    },
  };
}
