# E2E Testing with Playwright

> For a full overview of all testing infrastructure, CI/CD, and general troubleshooting, see [docs/TESTING.md](../docs/TESTING.md).
> All E2E test coverage, debugging, troubleshooting, and next steps are documented here.

This directory contains end-to-end tests for the Boom Voter application using Playwright.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **Supabase CLI** installed globally:
   ```bash
   ppnpm install -g supabase
   ```

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Setup local Supabase test environment:**

   ```bash
   pnpm run test:setup
   ```

3. **Setup test data:**

   ```bash
   pnpm run test:data
   ```

4. **Run tests:**
   ```bash
   pnpm run test:e2e
   ```

## 📁 Directory Structure

```
tests/
├── e2e/                    # E2E test files
│   ├── auth.spec.ts       # Authentication tests
│   ├── navigation.spec.ts # Navigation tests
│   └── artists.spec.ts    # Artist functionality tests
├── config/
│   └── test-env.ts        # Test environment configuration
├── utils/
│   └── test-helpers.ts    # Common test utilities
└── README.md              # This file
```

## 🧪 Available Test Commands

| Command                    | Description                                |
| -------------------------- | ------------------------------------------ |
| `pnpm run test:e2e`        | Run all tests in headless mode             |
| `pnpm run test:e2e:ui`     | Run tests with Playwright UI               |
| `pnpm run test:e2e:headed` | Run tests in headed mode (visible browser) |
| `pnpm run test:e2e:debug`  | Run tests in debug mode                    |
| `pnpm run test:e2e:report` | Open test report                           |
| `pnpm run test:setup`      | Setup local Supabase environment           |
| `pnpm run test:data`       | Setup test data in local Supabase          |

## 🔧 Configuration

### Environment Variables

The tests use the following environment variables:

- `TEST_SUPABASE_URL`: Local Supabase URL (default: `http://localhost:54321`)
- `TEST_SUPABASE_ANON_KEY`: Local Supabase anon key
- `PLAYWRIGHT_BASE_URL`: App base URL (default: `http://localhost:8080`)
- `TEST_USER_EMAIL`: Base email used for the passwordless test voter (default: `e2e-voter`)
- `TEST_USER_EMAIL_DOMAIN`: Domain appended to the base email (default: `example.com`)
- `TEST_MAILPIT_URL`: Local Supabase's Mailpit inbox API, used to read OTP codes (default: `http://127.0.0.1:54324`)

### Authentication in tests

The app only supports passwordless sign-in (magic link + 6-digit OTP), so
`TestHelpers.signIn()` drives the real flow end-to-end: it submits an email,
polls the local Supabase stack's Mailpit inbox (`TEST_MAILPIT_URL`) for the
OTP email, extracts the code, and completes it. Each call defaults to a
per-process email (`generateTestEmail()`) so parallel workers never race over
the same Mailpit inbox or OTP code. New accounts get the onboarding dialog's
username step auto-completed so it doesn't block later interactions.

### Test Data

The test data setup script creates:

- **Artists**: 3 test artists with different genres and schedules
- **Genres**: 5 test genres (Rock, Pop, Jazz, Electronic, Hip Hop)
- **Groups**: 3 test groups
- **Users**: 2 test users (regular user and admin)

## 🎯 Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Feature Name", () => {
  let testHelpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    testHelpers = new TestHelpers(page);
  });

  test("should do something", async ({ page }) => {
    await testHelpers.navigateTo("/");
    // Your test logic here
  });
});
```

### Using Test Helpers

The `TestHelpers` class provides common utilities:

```typescript
// Sign in
await testHelpers.signIn("user@example.com", "password");

// Navigate to page
await testHelpers.navigateTo("/artists");

// Wait for page load
await testHelpers.waitForPageLoad();

// Check authentication status
const isAuth = await testHelpers.isAuthenticated();

// Take screenshot
await testHelpers.takeScreenshot("test-name");
```

### Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Handle async operations**: Always wait for network requests and UI updates
3. **Test user flows**: Focus on complete user journeys rather than isolated components
4. **Use test data**: Leverage the test data setup for consistent scenarios
5. **Handle conditional elements**: Use `.isVisible()` checks for optional UI elements

## 📋 Test Coverage

### Current Tests

1. **Authentication**
   - Sign in dialog display
   - Page title verification
2. **Navigation**
   - Page routing
   - 404 handling
3. **Artists**
   - Artists list display
   - Filtering functionality
   - Artist detail navigation
   - Empty state handling
4. **Voting** (`voting.spec.ts`)
   - Casting each vote type (Must Go / Interested / Won't Go) and reflecting the selection
   - Votes persisting across a reload
   - Changing a vote updates the selection and vote counts instead of adding a second vote
   - Removing a vote returns the set to the unvoted state
   - Unauthenticated vote attempts surface the sign-in prompt instead of recording a vote

### Planned Tests

- User registration
- Group management
- Schedule viewing
- Admin features
- Mobile responsiveness
- Offline functionality

## 📊 Test Reports

### HTML Report

After running tests, view the interactive report:

```bash
pnpm run test:e2e:report
```

### Report Features

- Test results and timing
- Screenshots and videos
- Traces for debugging
- Error details and stack traces
- Filtering and search

## 🐛 Debugging

### Debug Mode

Run tests in debug mode to step through them:

```bash
pnpm run test:e2e:debug
```

### UI Mode

Use Playwright's UI for interactive debugging:

```bash
pnpm run test:e2e:ui
```

### Screenshots

Tests automatically capture screenshots on failure in `tests/screenshots/`

## 🔮 Next Steps

### Immediate

1. **Run initial tests** to verify setup
2. **Add more test scenarios** based on app features
3. **Configure test users** in local Supabase
4. **Add data-testid attributes** to components

### Future Enhancements

1. **Visual regression testing**
2. **Performance testing**
3. **Accessibility testing**
4. **API testing** with separate test suite
5. **Load testing** for critical user flows

## 🚨 Troubleshooting

### Common Issues

1. **Supabase not starting**: Check Docker is running
2. **Tests timing out**: Increase timeouts in config
3. **Element not found**: Update selectors to match UI
4. **Authentication failing**: Verify test user setup

### Getting Help

1. Check Playwright docs: https://playwright.dev/
2. Review test logs and screenshots
3. Use debug mode for step-by-step debugging
4. Check Supabase logs: `supabase logs`

## 🏆 Playwright & Testing Best Practices

- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
