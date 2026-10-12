const BASE_URL = 'https://www.elevennation.shop';

export interface SeoOptions {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | null;
}

export function setPageSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  jsonLd,
}: SeoOptions) {
  if (typeof document === 'undefined') return;

  // 1. Update Document Title
  document.title = title;

  // Helper to get or create a tag
  const getOrCreateMeta = (attribute: string, value: string): HTMLMetaElement => {
    let el = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attribute, value);
      document.head.appendChild(el);
    }
    return el;
  };

  // 2. Meta description
  getOrCreateMeta('name', 'description').content = description;

  // 3. Canonical URL
  const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const fullCanonicalUrl = `${BASE_URL}${normalizedPath === '/' ? '/' : normalizedPath}`;
  
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = fullCanonicalUrl;

  // 4. OpenGraph tags
  getOrCreateMeta('property', 'og:title').content = title;
  getOrCreateMeta('property', 'og:description').content = description;
  getOrCreateMeta('property', 'og:url').content = fullCanonicalUrl;
  if (ogImage) {
    getOrCreateMeta('property', 'og:image').content = ogImage;
  }

  // 5. Twitter tags
  getOrCreateMeta('name', 'twitter:title').content = title;
  getOrCreateMeta('name', 'twitter:description').content = description;
  if (ogImage) {
    getOrCreateMeta('name', 'twitter:image').content = ogImage;
  }

  // 6. JSON-LD structured data (e.g. Product schema)
  const existingJsonLd = document.getElementById('route-json-ld');
  if (existingJsonLd) {
    existingJsonLd.remove();
  }

  if (jsonLd) {
    const script = document.createElement('script');
    script.id = 'route-json-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
