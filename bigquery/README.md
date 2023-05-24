# Capo on BigQuery

[capo.sql](./capo.sql) is a BigQuery function that uses [Cheerio](https://cheerio.js.org/) to parse the HTML response bodies in HTTP Archive.

## Usage

<img width="1483" alt="Using capo on BigQuery" src="https://github.com/rviscomi/capo.js/assets/1120896/783b1787-210e-4c95-a2f5-1d551afae331">

Pass the HTML response body to the `httparchive.fn.CAPO` function:

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