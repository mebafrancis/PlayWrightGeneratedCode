import { test, expect } from '@playwright/test';

test('homepage has title and links', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
  const moreInfo = page.locator('a');
  await expect(moreInfo).toHaveCount(1);
});
