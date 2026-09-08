import React from 'react';

const TAG_RE = /<(img|video)\s+[^>]*src=["']([^"']+)["'][^>]*>(?:<\/video>)?/gi;

const isSafeUrl = (url: string): boolean =>
  /^https?:\/\//i.test(url) || url.startsWith('/');

export function renderPostContent(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const src = content ?? '';

  for (const match of src.matchAll(TAG_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(<span key={key++}>{src.slice(lastIndex, start)}</span>);
    }
    const tag = match[1].toLowerCase();
    const url = match[2];
    if (isSafeUrl(url)) {
      if (tag === 'img') {
        nodes.push(
          <img
            key={key++}
            src={url}
            alt=""
            style={{ maxWidth: '100%', display: 'block', margin: '12px 0', borderRadius: '8px' }}
          />
        );
      } else {
        nodes.push(
          <video
            key={key++}
            src={url}
            controls
            style={{ maxWidth: '100%', display: 'block', margin: '12px 0', borderRadius: '8px' }}
          />
        );
      }
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < src.length) {
    nodes.push(<span key={key++}>{src.slice(lastIndex)}</span>);
  }

  return nodes;
}

export function stripMediaForPreview(content: string): string {
  return (content ?? '')
    .replace(TAG_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractFirstImageUrl(content: string): string | undefined {
  const src = content ?? '';
  const IMG_RE = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i;
  const m = src.match(IMG_RE);
  if (m && isSafeUrl(m[1])) return m[1];
  return undefined;
}
