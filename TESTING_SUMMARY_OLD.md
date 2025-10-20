# Capo.js Testing Summary

## Current State Analysis

### ✅ What We Found

**capo.js (current state):**
- **Test files:** 0 (no test suite exists yet)
- **Source files:** 5 core modules in `src/lib/`
  - `rules.js` - 11 detector functions + weighting logic
  - `validation.js` - 20+ validation functions
  - `io.js` - Browser I/O and logging
  - `options.js` - Configuration
  - `colors.js` - Color utilities

**eslint-plugin-capo (reference):**
- **Test files:** 16 comprehensive test files
- **Test patterns:** Well-structured with `node:test`, ESLint RuleTester, dedent for readability
- **Coverage:** Full coverage of all 13 rules + utilities
- **Test structure:**
  ```
  tests/
  ├── index.test.js                    # Plugin metadata
  ├── rules/*.test.js                  # 13 rule tests
  └── utils/*.test.js                  # Utility tests
  ```

### 📊 Key Insights from eslint-plugin-capo

#### Pattern 1: Parameterized Tests
```javascript
// Test all http-equiv keywords in a loop
META_HTTP_EQUIV_KEYWORDS.forEach(keyword => {
  it(`should detect http-equiv="${keyword}"`, () => {
    const node = { /* ... */ };
    assert.strictEqual(isMeta(node), true);
  });
});
```

#### Pattern 2: Comprehensive Edge Case Testing
```javascript
describe('isSyncScript', () => {
  it('should detect synchronous script tags');
  it('should NOT detect async scripts');
  it('should NOT detect defer scripts');
  it('should NOT detect module scripts');
  it('should NOT detect JSON scripts');
});
```

#### Pattern 3: Using dedent for Readability
```javascript
code: dedent`
  <head>
    <meta charset="utf-8">
    <title>Test</title>
  </head>
`
```

## Recommended Approach

### Phase 0: Pre-Refactor Test Hardening (4 days)

**Goal:** Create comprehensive test suite BEFORE starting the adapter refactor

**Why this matters:**
- Prevents regressions during refactor
- Documents current behavior
- Provides confidence when making changes
- Enables safe iteration

### Quick Start

```bash
# 1. Install dependencies
cd /Users/rviscomi/git/capo.js
npm install --save-dev jsdom dedent

# 2. Create test directory structure
mkdir -p tests/{lib,integration,snapshots,fixtures/{heads,elements}}

# 3. Add test scripts to package.json
# (See TEST_PLAN.md section 3.1.1)

# 4. Start with setup helper
# Create tests/setup.js (template in TEST_PLAN.md section 3.1.2)

# 5. Begin with rules.js tests
# Create tests/lib/rules.test.js (template in TEST_PLAN.md section 3.2.1)
```

## Test Plan Overview

See **TEST_PLAN.md** for full details. Here's the summary:

### Phase 0.1: Setup (0.5 day)
- Add jsdom + dedent dependencies
- Create directory structure
- Build test helpers (createDocument, createElement, mockConsole)

### Phase 0.2: rules.js Tests (1.5 days)
- Test all 11 detector functions (isMeta, isTitle, etc.)
- Test getWeight() with all element types
- Test ElementWeights hierarchy
- **Pattern:** Use jsdom to create real DOM elements

### Phase 0.3: validation.js Tests (1 day)
- Test 20+ validation functions
- Test getValidationWarnings()
- Test edge cases (invalid values, missing elements)

### Phase 0.4: Integration Tests (0.5 day)
- Full document analysis in jsdom
- Browser-like environment testing

### Phase 0.5: Snapshot Tests (0.5 day)
- Baseline current behavior
- Use fixtures from examples/ directory
- Compare analysis results

## Key Differences: capo.js vs eslint-plugin-capo

| Aspect | eslint-plugin-capo | capo.js (will be) |
|--------|-------------------|-------------------|
| **DOM API** | @html-eslint/parser AST | Browser DOM (Element.matches, etc.) |
| **Test env** | ESLint RuleTester | jsdom |
| **Node creation** | Mock AST nodes | createElement() helper |
| **Selector testing** | Test AST node structure | Test actual DOM selectors |

**Example comparison:**

```javascript
// eslint-plugin-capo (AST nodes)
const node = {
  name: 'meta',
  attributes: [
    { key: { value: 'charset' }, value: { type: 'AttributeValue', value: 'utf-8' } }
  ]
};

// capo.js (DOM elements via jsdom)
const element = createElement('<meta charset="utf-8">');
```

## Success Metrics

### Coverage Goals
- **rules.js:** ≥95% coverage
- **validation.js:** ≥90% coverage
- **Overall:** ≥90% coverage

### Test Count Goals
- **Detector functions:** 11 functions × ~5 tests each = ~55 tests
- **Validation functions:** 20 functions × ~3 tests each = ~60 tests
- **Integration tests:** ~10 tests
- **Snapshot tests:** ~5 tests
- **Total:** ~130 tests

### Quality Criteria
- ✅ All tests pass: `npm test` → 0 failures
- ✅ No flaky tests (consistent results)
- ✅ Fast execution (< 5 seconds total)
- ✅ Clear test names (describe what's being tested)
- ✅ Good documentation (comments where needed)

## Next Steps

### Immediate Actions (Today)
1. Review TEST_PLAN.md in detail
2. Install dependencies: `npm install --save-dev jsdom dedent`
3. Create directory structure
4. Start with tests/setup.js helper

### This Week
1. **Day 1:** Setup + start rules.js tests (isMeta, isTitle, isPreconnect)
2. **Day 2:** Finish rules.js tests (remaining detectors + getWeight)
3. **Day 3:** validation.js tests (all validators)
4. **Day 4:** Integration + snapshot tests
5. **Day 5:** Review coverage, fix gaps, document results

### After Tests Complete
1. Commit baseline tests to git
2. Run and save coverage report: `npm run test:coverage > coverage-baseline.txt`
3. Begin MIGRATION_PLAN.md Phase 1 (Adapter Interface)
4. Run tests after each phase to catch regressions

## Resources

- **TEST_PLAN.md** - Complete test implementation plan (this file)
- **MIGRATION_PLAN.md** - Full v2.0 refactor plan (sections 3.9-3.12 cover testing)
- **eslint-plugin-capo tests/** - Reference implementation for patterns

## Questions to Consider

1. **Should we test io.js logging?** 
   - Medium priority - it's browser-specific and will be refactored
   - Focus on rules.js and validation.js first

2. **Should we include performance benchmarks?**
   - Yes, but later - add in Phase 0.6 if time permits
   - Useful for comparing pre/post-refactor performance

3. **Should we test with real HTML files?**
   - Yes! Use examples/*.html as fixtures
   - Copy to tests/fixtures/heads/ directory

4. **How to handle DOM-specific features?**
   - Use jsdom - it provides Element.matches(), querySelector(), etc.
   - This is the closest to actual browser environment

## Tips from eslint-plugin-capo Codebase

### ✅ Do's
- ✓ Use descriptive test names: `'should detect async scripts with src attribute'`
- ✓ Test both positive and negative cases
- ✓ Use parameterized tests for arrays of similar inputs
- ✓ Use dedent for multiline HTML strings
- ✓ Group related tests in describe blocks
- ✓ Test edge cases (empty, null, invalid values)

### ❌ Don'ts
- ✗ Don't use vague test names like `'test 1'`
- ✗ Don't skip edge cases
- ✗ Don't test implementation details (test behavior)
- ✗ Don't make tests dependent on each other
- ✗ Don't hardcode too many values (use variables/constants)

## Timeline Estimate

**Total effort:** 4 days (32 hours)

**Week 1 - Foundation:**
- Mon: Setup + rules.js detectors (6-8 hours)
- Tue: Finish rules.js + start validation.js (6-8 hours)
- Wed: Finish validation.js (6-8 hours)
- Thu: Integration + snapshots (6-8 hours)
- Fri: Review, gaps, coverage (4-6 hours)

**Week 2 - Refactor:**
- Begin MIGRATION_PLAN.md Phase 1 with confidence!

---

**Ready to start?** Begin with TEST_PLAN.md section 3.1 (Setup & Infrastructure).
