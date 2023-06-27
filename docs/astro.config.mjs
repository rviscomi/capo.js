import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'capo.js',
      social: {
        github: 'https://github.com/rviscomi/capo.js',
        twitter: 'https://twitter.com/rick_viscomi',
      },
      editLink: {
        baseUrl: 'https://github.com/rviscomi/capo.js/edit/main/docs/'
      },
      sidebar: [
        {
          label: 'Home',
          link: '/'
        },
        {
          label: 'Guides',
          items: [
            { label: 'Quick start', link: '/guides/quick-start/' },
            { label: 'Extension', link: '/guides/extension/' },
            { label: 'Snippet', link: '/guides/snippet/' },
            { label: 'WebPageTest', link: '/guides/webpagetest/' },
            { label: 'BigQuery', link: '/guides/bigquery/' },
          ],
        },
        {
          label: 'Developer reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
