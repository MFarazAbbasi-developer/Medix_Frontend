import { test, expect } from '@playwright/test';

test.describe('Medix Application Foundation E2E', () => {
  test('loads home page with title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Medix by FARMAX/i);
    await expect(page.locator('text=MEDIX')).toBeVisible();
  });
});
