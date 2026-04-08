import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';

const openapi = createOpenAPI({
  input: ['./openapi-sdk.json'],
});

void generateFiles({
  input: openapi,
  output: './content/docs/api',
  per: 'tag',
  meta: true,
  addGeneratedComment: true,
});
