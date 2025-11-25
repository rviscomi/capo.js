import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://rviscomi.github.io",
  base: "/capo.js",
  integrations: [
    starlight({
      title: "capo.js",
      head: [
        {
          tag: "script",
          attrs: {
            async: true,
            src: "https://www.googletagmanager.com/gtag/js?id=G-4BD76ZZBR6",
          },
        },
        {
          tag: "script",
          content: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-4BD76ZZBR6');`,
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://rviscomi.github.io/capo.js/capo-social-alt.webp",
          },
        },
      ],
      social: [
        { label: "GitHub", href: "https://github.com/rviscomi/capo.js", icon: "github" },
        { label: "Bluesky", href: "https://bsky.app/profile/rviscomi.dev", icon: "blueSky" },
      ],
      editLink: {
        baseUrl: "https://github.com/rviscomi/capo.js/edit/main/docs/",
      },
      sidebar: [
        {
          label: "Home",
          link: "/",
        },
        {
          label: "Demo 🚀",
          link: "/user/demo/",
        },
        {
          label: "Getting started",
          items: [
            { label: "Quick start", link: "/user/quick-start/" },
            { label: "Rules", link: "/user/rules/" },
            { label: "Improve performance", link: "/user/performance/" },
            { label: "Interpret results", link: "/user/actionability/" },
            {
              label: "Static vs dynamic assessment",
              link: "/user/assessment-mode/",
            },
            { label: "Validation", link: "/user/validation/" },
            { label: "Extension", link: "/user/extension/" },
          ],
        },
        {
          label: "Developer guides",
          items: [
            { label: "Contributing to Capo", link: "/developer/contributing/" },
            { label: "Custom adapters", link: "/developer/custom-adapters/" },
            {
              label: "Installing the extension locally",
              link: "/developer/crx-local/",
            },
            { label: "Migration to v2", link: "/migration-v2/" },
          ],
        },
      ],
      customCss: ["/src/styles/custom.css"],
    }),
  ],
});
