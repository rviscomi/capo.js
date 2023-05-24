# Capo on BigQuery

[capo.sql](./capo.sql) is a BigQuery function that uses [Cheerio](https://cheerio.js.org/) to parse the HTML response bodies in HTTP Archive.

## Usage

Pass the HTML response body to the `httparchive.fn.CAPO` function:

```sql
WITH req AS (
  SELECT
    page,
    response_body
  FROM
    `httparchive.all.requests` TABLESAMPLE SYSTEM (0.001 PERCENT)
  WHERE
    date = '2023-05-01' AND
    client = 'desktop' AND
    is_main_document
  LIMIT
    1
)

SELECT
  page,
  vizWeight,
  weight,
  element
FROM
  req,
  UNNEST(httparchive.fn.CAPO(response_body))
```

Results:

page | vizWeight | weight | element
-- | -- | -- | --
https://www.example.com/ | ██████████ | 9 | `<title>Example Domain</title>`
https://www.example.com/ | ███████████ | 10 | `<meta charset="utf-8">`
https://www.example.com/ | ███████████ | 10 | `<meta http-equiv="Content-type" content="text/html; charset=utf-8">`
https://www.example.com/ | ███████████ | 10 | `<meta name="viewport" content="width=device-width, initial-scale=1">`
https://www.example.com/ | █████ | 4 | `<style type="text/css">...</style>`
