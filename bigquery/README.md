# Capo on BigQuery

[capo.sql](./capo.sql) is a BigQuery function that uses [Cheerio](https://cheerio.js.org/) to parse strings of HTML.

## Usage

<img width="1483" alt="Using capo on BigQuery" src="https://github.com/rviscomi/capo.js/assets/1120896/783b1787-210e-4c95-a2f5-1d551afae331">

To analyze pages in HTTP Archive, pass the HTML response body to the [`httparchive.fn.CAPO`](https://console.cloud.google.com/bigquery?ws=!1m5!1m4!6m3!1shttparchive!2sfn!3sCAPO) function:

```sql
SELECT
  page,
  httparchive.fn.CAPO(response_body) AS capo
FROM
  `httparchive.all.requests` TABLESAMPLE SYSTEM (0.001 PERCENT)
WHERE
  date = '2023-05-01' AND
  client = 'desktop' AND
  is_main_document
LIMIT
  1
```

Results:

page | vizWeight | weight | element
-- | -- | -- | --
https://www.example.com/ | ██████████ | 9 | `<title>Example Domain</title>`
https://www.example.com/ | ███████████ | 10 | `<meta charset="utf-8">`
https://www.example.com/ | ███████████ | 10 | `<meta http-equiv="Content-type" content="text/html; charset=utf-8">`
https://www.example.com/ | ███████████ | 10 | `<meta name="viewport" content="width=device-width, initial-scale=1">`
https://www.example.com/ | █████ | 4 | `<style type="text/css">...</style>`

Note that the HTML for some pages might be so large that it causes UDF timeouts/OOMs. One workaround is to extract only the `<head>` content before passing it into the function:

```sql
httparchive.fn.CAPO(REGEXP_EXTRACT(response_body, r'(?i)(.*</head>)'))
```

## Testing

If needed, you can pass arbitrary strings of HTML to the function on BigQuery without incurring any processing costs:

```sql
SELECT httparchive.fn.CAPO('''
<html>
  <head>
    <title>Example</title>
    <link rel="manifest" href="/manifest.json">
    <style></style>
    <script defer src="script.js"></script>
    <meta charset="utf-8">
  </head>
</html>
''')
```

Results:

vizWeight | weight | element
-- | -- | --
██████████ | 9 | `<title>Example</title>`
█ | 0 | `<link rel="manifest" href="/manifest.json">`
█████ | 4 | `<style></style>`
███ | 2 | `<script defer="" src="script.js"></script>`
███████████ | 10 | `<meta charset="utf-8">`

## Aggregate statistics

Using [capo.sql](./capo.sql) it's possible to analyze the entire HTTP Archive corpus.

Here's an example of counting the number of pages whose `<head>` starts with an element of a given weight:

```sql
WITH firstHeadElements AS (
  SELECT
    httparchive.fn.CAPO(REGEXP_EXTRACT(response_body, r'(?i)(.*</head>)'))[SAFE_OFFSET(0)] AS capo
  FROM
    `httparchive.all.requests`
  WHERE
    date = '2023-05-01' AND
    client = 'mobile' AND
    is_main_document
)

SELECT
  capo.weight,
  COUNT(0) AS pages
FROM
  firstHeadElements
WHERE
  capo.weight IS NOT NULL
GROUP BY
  weight
ORDER BY
  weight DESC
```

Results:

weight | pages
-- | --
10 | 800,752
9 | 202,438
8 | 30,555
7 | 98,241
6 | 14,210
5 | 600,997
4 | 1,546,590
3 | 142,417
2 | 85,653
1 | 22,148
0 | 1,211,124

Not every page will necessarily have an element of weight 10 (META) but these results definitely show a suprisingly high number of sites that lead with lower weights like 4 (SYNC_STYLES) and 0 (OTHER).
