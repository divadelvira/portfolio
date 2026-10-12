const entities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export function renderCmsMetadata(html: string, metadata: Record<string, string>) {
  return html.replace(/\{\{cms\.(\w+)\}\}/g, (_match, key: string) => {
    const value = metadata[key];
    if (typeof value !== 'string') throw new Error(`Missing CMS metadata: ${key}`);
    const content = key === 'socialImage' ? new URL(value, metadata.siteUrl).href : value;
    return content.replace(/[&<>"']/g, character => entities[character]);
  });
}
