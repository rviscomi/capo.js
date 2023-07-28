import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://rviscomi.github.io',
  base: '/capo.js',
  experimental: {
    assets: true
  },
  integrations: [
    starlight({
      title: 'capo.js',
      head: [
        {
          tag: 'script',
          attrs: {
            async: true,
            src: 'https://www.googletagmanager.com/gtag/js?id=G-4BD76ZZBR6'
          }
        },
        {
          tag: 'script',
          content: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-4BD76ZZBR6');`
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://rviscomi.github.io/capo.js/capo-social-alt.webp'
          }
        }
      ],
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
          label: 'Getting started',
          items: [
            { label: 'Quick start', link: '/user/quick-start/' },
            { label: 'Rules', link: '/user/rules/' },
            { label: 'Improve performance', link: '/user/performance/' },
            { label: 'Interpret results', link: '/user/actionability/' },
            { label: 'Static vs dynamic assessment', link: '/user/assessment-mode/' },
            { label: 'Validation', link: '/user/validation/' },
            { label: 'Configuration', link: '/user/config/' },
          ],
        },
        {
          label: 'User guides',
          items: [
            { label: 'Extension', link: '/user/extension/' },
            { label: 'Snippet', link: '/user/snippet/' },
            { label: 'WebPageTest', link: '/user/webpagetest/' },
            { label: 'BigQuery', link: '/user/bigquery/' },
          ],
        },
        {
          label: 'Developer guides',
          items: [
            { label: 'Contributing to Capo', link: '/developer/contributing/' },
            { label: 'Installing the extension locally', link: '/developer/crx-local/' },
          ],
        },
      ],
      customCss: [
        '/src/styles/custom.css',
      ],
    }),
  ],
});
