# Test Coverage Quick Reference

## Generate Coverage Report

```bash
npm run test:cov
```

## View Coverage Report

```bash
# Open HTML report in browser
open coverage/index.html        # macOS
xdg-open coverage/index.html    # Linux
start coverage/index.html       # Windows
```

## Coverage Thresholds

| Metric     | Threshold |
| ---------- | --------- |
| Branches   | 70%       |
| Functions  | 75%       |
| Lines      | 80%       |
| Statements | 80%       |

## Report Formats

- **HTML**: `coverage/index.html` - Interactive web report
- **LCOV**: `coverage/lcov.info` - For CI/CD tools
- **JSON**: `coverage/coverage-final.json` - Machine-readable
- **Console**: Displayed after test run

## Coverage by Test Type

```bash
# Unit tests only
npm test -- --coverage --testPathPattern=unit

# Integration tests only
npm test -- --coverage --testPathPattern=integration

# E2E tests only
npm run test:e2e -- --coverage
```

## Current Coverage

Run `npm run test:cov` to see current coverage metrics.

**Well-Covered Components:**

- ✅ Repositories (100%)
- ✅ Auth Guards (100%)
- ✅ Auth Utilities (100%)

## Improving Coverage

1. Open `coverage/index.html`
2. Navigate to files with low coverage
3. Red lines = uncovered code
4. Yellow lines = partially covered branches
5. Add tests for uncovered scenarios

## CI/CD Integration

The LCOV format (`coverage/lcov.info`) is ready for:

- Codecov
- Coveralls
- SonarQube
- GitHub Actions

See [COVERAGE.md](./COVERAGE.md) for detailed documentation.
