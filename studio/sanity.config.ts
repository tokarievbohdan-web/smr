import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

// projectId береться зі змінної оточення SANITY_STUDIO_PROJECT_ID (див. .env)
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'REPLACE_WITH_PROJECT_ID'

export default defineConfig({
  name: 'sport-market',
  title: 'Sport Market CMS',
  projectId,
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes},
})
