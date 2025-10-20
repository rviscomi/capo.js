# ✅ JSDOM IS THE RIGHT TOOL - Key Insight

## The Question
> "If jsdom barfs on invalid HTML like `<div>` in `<head>`, is it the right tool to test this library?"

## The Answer: YES! ✅

**JSDOM is perfect BECAUSE it mirrors browser behavior.**

## The Key Insight: The static-head Trick

### The Problem
Browsers automatically "fix" invalid HTML. When you write:
```html
<head>
  <meta charset="utf-8">
  <div>Invalid!</div>
  <title>Test</title>
</head>
```

The browser's HTML parser moves the `<div>` to `<body>`:
```html
<head>
  <meta charset="utf-8">
  <title>Test</title>
</head>
<body>
  <div>Invalid!</div>
</body>
```

So capo.js never sees the invalid element!

### The Solution (Already in Production!)

**Capo.js uses a clever trick** (see `src/lib/io.js:24`):

```javascript
html = html.replace(/(\<\/?)(head)/gi, "$1static-head");
```

By renaming `<head>` to `<static-head>`, the browser doesn't recognize it as a special element, so it doesn't "fix" the invalid HTML. Invalid elements stay in place where capo.js can detect them!

### Test Results Prove It Works

```bash
=== WITHOUT static-head trick ===
head.children: [ 'META' ]          # div was moved!
body.children: [ 'DIV', 'SPAN', 'TITLE' ]

=== WITH static-head trick ===
static-head.children: [ 'META', 'DIV', 'SPAN', 'TITLE' ]  # All preserved!

Validation check:
  <meta>: ✓ valid
  <div>: ✗ INVALID    ← Successfully detected!
  <span>: ✗ INVALID   ← Successfully detected!
  <title>: ✓ valid
```

### Our Test Strategy

**Use the same `static-head` trick in tests:**

```javascript
function createHead(html, useStaticHead = true) {
  const fullHtml = `<!DOCTYPE html><html><head>${html}</head><body></body></html>`;
  
  // Apply static-head trick just like capo.js does in production
  const modifiedHtml = useStaticHead 
    ? fullHtml.replace(/(\<\/?)(head)/gi, "$1static-head")
    : fullHtml;
  
  const dom = new JSDOM(modifiedHtml);
  return dom.window.document.querySelector(useStaticHead ? 'static-head' : 'head');
}
```

## Why JSDOM is Perfect

1. **Mirrors browser behavior** - Parses HTML exactly like browsers do
2. **Supports the static-head trick** - Works with capo.js's production approach
3. **Fast** - No need for a real browser or Playwright
4. **Simple** - Easy to set up and use in Node.js tests
5. **Battle-tested** - Used by thousands of projects including eslint-plugin-capo

## Test Results: 89/89 Passing ✅

```bash
✔ rules.js (260.58ms)
  ✔ ElementWeights (0.75ms)
  ✔ isMeta (88.30ms)
  ✔ isTitle (8.07ms)
  ... (11 detector functions tested)
  ✔ getWeight (40.34ms)
  ✔ getHeadWeights (7.08ms)

✔ validation.js (139.32ms)
  ✔ VALID_HEAD_ELEMENTS (1.16ms)
  ✔ isValidElement (84.74ms)
  ✔ hasValidationWarning (32.16ms)
  ✔ getValidationWarnings (20.86ms)

ℹ tests 89
ℹ pass 89
ℹ fail 0
```

## Conclusion

**JSDOM + static-head trick = Perfect testing environment for capo.js**

The library already uses this approach in production, so our tests mirror real-world usage exactly. No need for Playwright, real browsers, or any other complex setup!

---

**Updated files:**
- ✅ `tests/setup.js` - Uses static-head trick
- ✅ `tests/lib/rules.test.js` - 89 tests passing
- ✅ `tests/lib/validation.test.js` - Includes invalid element tests
- ✅ `TEST_PLAN.md` - Documents the static-head approach
