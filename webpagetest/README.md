# WebPageTest custom metric

To run this on WebPageTest:

1. Go to webpagetest.org
2. Enter a URL
3. Paste [webpagetest/capo.js](https://github.com/rviscomi/capo.js/blob/main/webpagetest/capo.js) in the `Custom` tab under advanced settings

![image](https://github.com/rviscomi/capo.js/assets/1120896/b15e0650-116f-4da2-855e-404a4127ce67)

On the Details pags of the results, you can extract the actual sort order from the `capo` object. For example, here are the [results](https://www.webpagetest.org/result/230521_BiDcBD_6Y6/1/details/) for almanac.httparchive.org:

```js
[
    "[\"███████████\",10,\"META[charset=\\\"UTF-8\\\"]\"]",
    "[\"███████████\",10,\"META[name=\\\"viewport\\\"][content=\\\"width=device-width, initial-scale=1\\\"]\"]",
    "[\"██████████\",9,\"TITLE\"]",
    "[\"█████\",4,\"LINK[rel=\\\"stylesheet\\\"][href=\\\"/static/css/normalize.css?v=3a712a3381a95c0a7b7c6ed3aa03b911\\\"]\"]",
    "[\"█████\",4,\"LINK[rel=\\\"stylesheet\\\"][href=\\\"/static/css/almanac.css?v=f05fef6658e217eccdc03ecada33e256\\\"]\"]",
    "[\"█████\",4,\"LINK[rel=\\\"stylesheet\\\"][href=\\\"/static/css/index.css?v=69e30c0abbe9bb2368e12e7e8779d421\\\"]\"]",
    "[\"████\",3,\"LINK[rel=\\\"preload\\\"][href=\\\"/static/fonts/Poppins-Light.woff2\\\"][as=\\\"font\\\"][type=\\\"font/woff2\\\"][crossorigin=\\\"\\\"]\"]",
    "[\"████\",3,\"LINK[rel=\\\"preload\\\"][href=\\\"/static/fonts/Lato-Regular.woff2\\\"][as=\\\"font\\\"][type=\\\"font/woff2\\\"][crossorigin=\\\"\\\"]\"]",
    "[\"████\",3,\"LINK[rel=\\\"preload\\\"][href=\\\"/static/fonts/Poppins-Bold.woff2\\\"][as=\\\"font\\\"][type=\\\"font/woff2\\\"][crossorigin=\\\"\\\"]\"]",
    "[\"████\",3,\"LINK[rel=\\\"preload\\\"][href=\\\"/static/fonts/Lato-Black.woff2\\\"][as=\\\"font\\\"][type=\\\"font/woff2\\\"][crossorigin=\\\"\\\"]\"]",
    "[\"████\",3,\"LINK[rel=\\\"preload\\\"][href=\\\"/static/fonts/Lato-Bold.woff2\\\"][as=\\\"font\\\"][type=\\\"font/woff2\\\"][crossorigin=\\\"\\\"]\"]",
    "[\"██████\",5,\"SCRIPT[nonce=\\\"hrOXpHAzo0MQdCYpDz0B4085cKO5EtIo\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"shortcut icon\\\"][href=\\\"/static/images/favicon.ico\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"apple-touch-icon\\\"][href=\\\"/static/images/apple-touch-icon.png\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"description\\\"][content=\\\"The Web Almanac is an annual state of the web report combining the expertise of the web community with the data and trends of the HTTP Archive.\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:title\\\"][content=\\\"The 2022 Web Almanac\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:url\\\"][content=\\\"https://almanac.httparchive.org/en/2022/\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:image\\\"][content=\\\"https://almanac.httparchive.org/static/images/home-hero-2022.png\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:image:height\\\"][content=\\\"600\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:image:width\\\"][content=\\\"1200\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:type\\\"][content=\\\"article\\\"]\"]",
    "[\"█\",0,\"META[property=\\\"og:description\\\"][content=\\\"The Web Almanac is an annual state of the web report combining the expertise of the web community with the data and trends of the HTTP Archive.\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"twitter:card\\\"][content=\\\"summary_large_image\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"twitter:site\\\"][content=\\\"@HTTPArchive\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"twitter:title\\\"][content=\\\"The 2022 Web Almanac\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"twitter:image\\\"][content=\\\"https://almanac.httparchive.org/static/images/home-hero-2022.png\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"twitter:image:alt\\\"][content=\\\"The 2022 Web Almanac\\\"]\"]",
    "[\"█\",0,\"META[name=\\\"twitter:description\\\"][content=\\\"The Web Almanac is an annual state of the web report combining the expertise of the web community with the data and trends of the HTTP Archive.\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"webmention\\\"][href=\\\"https://webmention.io/almanac.httparchive.org/webmention\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"pingback\\\"][href=\\\"https://webmention.io/almanac.httparchive.org/xmlrpc\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"me\\\"][href=\\\"mailto:team@httparchive.org\\\"]\"]",
    "[\"█\",0,\"SCRIPT[type=\\\"application/ld+json\\\"]\"]",
    "[\"█\",0,\"SCRIPT[type=\\\"application/ld+json\\\"]\"]",
    "[\"█\",0,\"SCRIPT[type=\\\"application/ld+json\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"canonical\\\"][href=\\\"https://almanac.httparchive.org/en/2022/\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][type=\\\"application/rss+xml\\\"][title=\\\"Web Almanac by HTTP Archive RSS (en)\\\"][href=\\\"/en/rss.xml\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/en/2022/\\\"][hreflang=\\\"en\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/es/2022/\\\"][hreflang=\\\"es\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/fr/2022/\\\"][hreflang=\\\"fr\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/hi/2022/\\\"][hreflang=\\\"hi\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/it/2022/\\\"][hreflang=\\\"it\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/ja/2022/\\\"][hreflang=\\\"ja\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/nl/2022/\\\"][hreflang=\\\"nl\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/pt/2022/\\\"][hreflang=\\\"pt\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/ru/2022/\\\"][hreflang=\\\"ru\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/tr/2022/\\\"][hreflang=\\\"tr\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/uk/2022/\\\"][hreflang=\\\"uk\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/zh-CN/2022/\\\"][hreflang=\\\"zh-CN\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/zh-TW/2022/\\\"][hreflang=\\\"zh-TW\\\"]\"]",
    "[\"█\",0,\"LINK[rel=\\\"alternate\\\"][href=\\\"https://almanac.httparchive.org/en/2022/\\\"][hreflang=\\\"x-default\\\"]\"]"
]
```