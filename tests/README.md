# E2E Test Suite for Encounters Telehealth Platform

This directory contains comprehensive end-to-end tests for all features of the Encounters telehealth platform.

## Test Files Overview

### Core Feature Tests

#### 1. `encounter-management.spec.ts`
Tests for encounter scheduling, rescheduling, and deletion functionality:
- Schedule encounters with existing patients
- Create new patients and schedule encounters
- Reschedule encounters from calendar view
- Delete encounters from calendar
- Conditional rendering of schedule section
- Form assignment workflow

#### 2. `queue-management-comprehensive.spec.ts`
Tests for the complete queue management system:
- Anonymous patient check-in
- Queue statistics display
- Converting queue patients to encounters
- Check-in link functionality
- Queue state updates
- Contact information display

#### 3. `presence-system.spec.ts`
Tests for real-time presence functionality:
- Presence indicators in encounter list
- Provider presence updates
- Patient presence updates
- Presence timeout handling
- Multiple participant presence
- Call join/leave presence updates

#### 4. `calendar-features.spec.ts`
Tests for calendar functionality:
- Calendar navigation (month/week view)
- Encounter display on calendar
- Reschedule modal functionality
- Delete encounter from calendar
- Today indicator
- Calendar state persistence

#### 5. `patient-dashboard-features.spec.ts`
Tests for patient-side functionality:
- Patient dashboard display
- Intake form conditional rendering
- Media controls and device selection
- Waiting room functionality
- Chat functionality
- Mobile responsive layout
- Form validation

#### 6. `ui-improvements.spec.ts`
Tests for UI improvements and conditional rendering:
- Schedule section visibility logic
- Removed Quick Actions section
- Combined queue management
- Presence indicators
- Responsive layout
- Loading and empty states

### Comprehensive Test Suites

#### 7. `run-all-features.spec.ts`
Complete end-to-end workflow tests:
- Complete patient check-in to encounter completion
- Complete patient management workflow
- Complete queue management workflow
- Complete calendar management workflow

## Running the Tests

### Prerequisites
1. Ensure the development server is running (`npm run dev`)
2. Ensure Convex is running (`npx convex dev`)
3. Make sure test data is available (run seed scripts if needed)

### Running All Tests
```bash
npx playwright test
```

### Running Specific Test Files
```bash
# Run encounter management tests
npx playwright test encounter-management.spec.ts

# Run queue management tests
npx playwright test queue-management-comprehensive.spec.ts

# Run presence system tests
npx playwright test presence-system.spec.ts

# Run calendar tests
npx playwright test calendar-features.spec.ts

# Run patient dashboard tests
npx playwright test patient-dashboard-features.spec.ts

# Run UI improvement tests
npx playwright test ui-improvements.spec.ts

# Run comprehensive workflow tests
npx playwright test run-all-features.spec.ts
```

### Running Tests in Different Browsers
```bash
# Run in Chrome
npx playwright test --project=chromium

# Run in Firefox
npx playwright test --project=firefox

# Run in Safari
npx playwright test --project=webkit

# Run on mobile Chrome
npx playwright test --project="Mobile Chrome"

# Run on mobile Safari
npx playwright test --project="Mobile Safari"
```

### Running Tests with UI
```bash
# Open Playwright UI
npx playwright test --ui

# Run tests in headed mode
npx playwright test --headed
```

### Running Tests in Debug Mode
```bash
# Run specific test in debug mode
npx playwright test --debug encounter-management.spec.ts

# Run with slow motion
npx playwright test --headed --timeout=0
```

## Test Data Requirements

The tests assume the following test data is available:
- Provider account: `provider@demo.test` / `demo123`
- Sample patients (e.g., "John Doe")
- Sample encounters for testing

If test data is missing, run the seed scripts:
```bash
npm run seed
```

## Test Coverage

### Provider Features
- ✅ Patient management (create, select, view)
- ✅ Encounter scheduling and management
- ✅ Queue management and patient conversion
- ✅ Calendar view and navigation
- ✅ Real-time presence indicators
- ✅ Form assignment
- ✅ Call management

### Patient Features
- ✅ Anonymous check-in
- ✅ Patient dashboard
- ✅ Intake form completion
- ✅ Media controls
- ✅ Chat functionality
- ✅ Call joining/leaving
- ✅ Mobile responsiveness

### System Features
- ✅ Real-time presence updates
- ✅ Queue state management
- ✅ Encounter lifecycle
- ✅ UI conditional rendering
- ✅ Responsive design
- ✅ Error handling

## Test Structure

Each test file follows this structure:
1. **Setup**: Login and navigate to relevant pages
2. **Action**: Perform the test actions
3. **Verification**: Assert expected outcomes
4. **Cleanup**: Return to initial state (if needed)

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Realistic Data**: Use realistic test data that matches production scenarios
3. **Error Handling**: Test both success and failure scenarios
4. **Performance**: Tests should complete within reasonable timeframes
5. **Maintainability**: Use descriptive test names and clear assertions

## Troubleshooting

### Common Issues

1. **Tests failing due to missing data**
   - Run seed scripts to populate test data
   - Check that Convex is running

2. **Timing issues**
   - Increase timeouts for slow operations
   - Use `waitForSelector` for dynamic content

3. **Browser compatibility**
   - Test on multiple browsers
   - Check for browser-specific selectors

4. **Mobile responsiveness**
   - Test on mobile viewports
   - Verify touch interactions work

### Debug Tips

1. **Use Playwright Inspector**
   ```bash
   npx playwright test --debug
   ```

2. **Take screenshots on failure**
   - Screenshots are automatically saved on test failure

3. **View test traces**
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

4. **Check console logs**
   - Tests capture browser console logs
   - Check for JavaScript errors

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Parallel execution for faster results
- Retry logic for flaky tests
- Comprehensive reporting
- Cross-browser compatibility

## Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add appropriate test descriptions
3. Include both positive and negative test cases
4. Update this README with new test information
5. Ensure tests are isolated and reliable
