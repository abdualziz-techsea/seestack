import { docs } from 'collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { createElement } from 'react';
import {
  BoxIcon,
  WebhookIcon,
  BookOpenIcon,
  DownloadIcon,
  RocketIcon,
  SettingsIcon,
} from 'lucide-react';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

const icons: Record<string, React.ComponentType> = {
  Box: BoxIcon,
  Webhook: WebhookIcon,
  BookOpen: BookOpenIcon,
  Download: DownloadIcon,
  Rocket: RocketIcon,
  Settings: SettingsIcon,
};

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [openapiPlugin()],
  icon(icon) {
    if (!icon || !(icon in icons)) return;
    return createElement(icons[icon]);
  },
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
