# Test Coverage Report

This document provides information about test coverage configuration and how to generate and view coverage reports.

## Coverage Configuration

The project is configured with the following coverage thresholds in `package.json`:

- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 80%
- **Statements**: 80%

## Generating Coverage Reports

### Generate HTML Coverage Report

```bash
npm run test:cov
```

This will:

1. Run all unit tests
2. Generate coverage data
3. Create an HTML report in `coverage/` directory
4. Display a summary in the terminal

### View HTML Report

After running `npm run test:cov`, open the HTML report:

```bash
open coverage/index.html        # macOS
xdg-open coverage/index.html    # Linux
start coverage/index.html       # Windows
```

### Coverage Report Formats

The following report formats are generated:

1. **Text**: Console output showing coverage summary
2. **Text-Summary**: Brief summary in console
3. **HTML**: Interactive web-based report (`coverage/index.html`)
4. **LCOV**: Standard format for CI/CD integration (`coverage/lcov.info`)
5. **JSON**: Machine-readable format (`coverage/coverage-final.json`)

## Coverage Reports by Test Type

### Unit Tests Coverage

```bash
npm test -- --coverage --testPathPattern=unit
```

### Integration Tests Coverage

```bash
npm test -- --coverage --testPathPattern=integration
```

### E2E Tests Coverage

```bash
npm run test:e2e -- --coverage
```

## Understanding Coverage Metrics

### Lines Coverage

Percentage of executable lines that were executed during tests.

### Branches Coverage

Percentage of conditional branches (if/else, switch, ternary) that were executed.

### Functions Coverage

Percentage of functions that were called during tests.

### Statements Coverage

Percentage of statements that were executed during tests.

## Coverage Exclusions

The following files/directories are excluded from coverage:

- `**/*.d.ts` - TypeScript declaration files
- `**/node_modules/**` - Dependencies
- `**/dist/**` - Compiled output
- `**/coverage/**` - Coverage reports
- `**/generated/**` - Generated Prisma client
- `main.ts` - Application entry point

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:cov

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
```

### Coverage Badges

You can add coverage badges to your README using services like:

- **Codecov**: `https://codecov.io/gh/username/repo/branch/main/graph/badge.svg`
- **Coveralls**: `https://coveralls.io/repos/github/username/repo/badge.svg`

## Improving Coverage

### Identify Uncovered Code

1. Open the HTML coverage report
2. Navigate through files to see highlighted uncovered lines
3. Red lines indicate uncovered code
4. Yellow lines indicate partially covered branches

### Add Tests for Uncovered Code

Focus on:

1. Error handling paths
2. Edge cases
3. Conditional branches
4. Utility functions
5. Guard clauses

### Example: Improving Branch Coverage

```typescript
// Before: Only testing the happy path
it('should process valid input', () => {
  expect(processInput('valid')).toBe(true);
});

// After: Testing both branches
it('should process valid input', () => {
  expect(processInput('valid')).toBe(true);
});

it('should reject invalid input', () => {
  expect(processInput('')).toBe(false);
});
```

## Coverage Thresholds

If coverage falls below the configured thresholds, the test run will fail:

```
Jest: "global" coverage threshold for branches (70%) not met: 65%
```

To temporarily bypass thresholds during development:

```bash
npm test -- --coverage --coverageThreshold='{}'
```

## Best Practices

1. **Aim for High Coverage**: Target 80%+ coverage for critical code
2. **Quality Over Quantity**: 100% coverage doesn't guarantee bug-free code
3. **Test Behavior**: Focus on testing behavior, not implementation details
4. **Regular Monitoring**: Check coverage reports regularly
5. **CI Integration**: Fail builds if coverage drops below thresholds

## Troubleshooting

### Coverage Not Generated

Ensure you're using the `--coverage` flag:

```bash
npm test -- --coverage
```

### Low Coverage Numbers

- Check if test files are being executed
- Verify coverage exclusions in `package.json`
- Ensure tests are actually calling the code

### Coverage Report Not Opening

- Verify the `coverage/` directory exists
- Check that `index.html` was generated
- Try a different browser

## Coverage Tools

### VS Code Extensions

- **Coverage Gutters**: Shows coverage inline in editor
- **Jest Runner**: Run tests and see coverage in VS Code

### Command Line Tools

```bash
# Generate coverage and open report
npm run test:cov && open coverage/index.html

# Watch mode with coverage
npm test -- --coverage --watch

# Coverage for specific file
npm test -- --coverage --testPathPattern=user.service
```

## Summary

- ✅ Coverage thresholds configured (70-80%)
- ✅ Multiple report formats (HTML, LCOV, JSON)
- ✅ Proper exclusions for generated/dependency files
- ✅ CI/CD ready with LCOV format
- ✅ Easy to view with HTML reports

Run `npm run test:cov` to generate your first coverage report!
