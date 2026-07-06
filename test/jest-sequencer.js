/**
 * Custom Jest sequencer that ensures integration tests run sequentially
 * after all unit tests complete. This prevents database conflicts when
 * multiple integration tests try to clean/modify the same database.
 */
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // First, separate integration tests from unit tests
    const integrationTests = tests.filter((t) =>
      t.path.includes('/integration/'),
    );
    const unitTests = tests.filter((t) => !t.path.includes('/integration/'));

    // Sort each group alphabetically for consistency
    const sortedUnit = [...unitTests].sort((a, b) =>
      a.path.localeCompare(b.path),
    );
    const sortedIntegration = [...integrationTests].sort((a, b) =>
      a.path.localeCompare(b.path),
    );

    // Run unit tests first (can be parallel), then integration tests (at the end)
    return [...sortedUnit, ...sortedIntegration];
  }
}

module.exports = CustomSequencer;
