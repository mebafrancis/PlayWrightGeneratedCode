import { test, expect } from '@playwright/test';

// This test navigates to the practise login page, logs in, adds "iphone X" to cart
// and verifies that the product appears on the checkout/cart page.
// Notes: selectors use a few fallbacks to be resilient to minor markup differences.

test('login, add iPhone X to cart and verify in checkout', async ({ page }) => {
  // Go to login page
  await page.goto('https://rahulshettyacademy.com/loginpagePractise/');

  // Fill username/password using a combination of selectors as fallbacks
  const usernameLocator = page.locator('input[name="username"], #username, input[placeholder="Username"], input[type="text"]');
  const passwordLocator = page.locator('input[name="password"], #password, input[type="password"]');

  await usernameLocator.first().fill('rahulshettyacademy');
  await passwordLocator.first().fill('learning');

  // Click sign in - try common button selectors
  const signIn = page.locator('button:has-text("Sign In"), button:has-text("Sign in"), button:has-text("Login"), input[type="submit"], #signInBtn').first();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
    signIn.click()
  ]); 

  // Wait for shop/products area to load
  await page.waitForLoadState('networkidle');

  // Locate the product card containing 'iphone X' and click its add-to-cart button
  // Find the product card that contains 'iphone X' by iterating product cards
  const cards = page.locator('.card, .product');
  const cardsCount = await cards.count();
  let targetCard = null;
  for (let i = 0; i < cardsCount; ++i) {
    const card = cards.nth(i);
    if (await card.locator('text=iphone X').count() > 0) {
      targetCard = card;
      break;
    }
  }
  if (!targetCard) {
    // As a last resort check any text match on page
    const txt = page.locator('text=iphone X');
    await expect(txt).toBeVisible({ timeout: 10_000 });
    // try to find ancestor card for the text match
    const ancestor = txt.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "product")]');
    if (await ancestor.count() > 0) {
      targetCard = ancestor.first();
    }
  }
  if (!targetCard) throw new Error('Product "iphone X" not found on the page');

  // Within that card, click the Add To Cart / Add button. Try several button text variants.
  const addButton = targetCard.locator('button:has-text("Add To Cart"), button:has-text("Add to Cart"), button:has-text("Add"), button:has-text("ADD TO CART")');
  await addButton.first().click();

  // Go to Checkout / Cart page - try selectors sequentially to avoid CSS parse issues
  let checkout = page.locator('a:has-text("Checkout")');
  if (await checkout.count() === 0) {
    checkout = page.locator('button:has-text("Checkout")');
  }
  if (await checkout.count() === 0) {
    // try textual matches (single-selector usage)
    checkout = page.locator('text=Cart');
  }
  if (await checkout.count() > 0) {
    await checkout.first().click().catch(() => {});
  } else {
    // fallback: try header/cart link by href or aria
    const alt = page.locator('a[href*="cart"], a[href*="checkout"], button[aria-label*="cart"]').first();
    await alt.click().catch(() => {});
  }

  // Wait for checkout page / cart details to load
  await page.waitForLoadState('networkidle');

  // Assert that the checkout/cart contains the product name 'iphone X'
  const cartTable = page.locator('table, .cart, .cart-items, .cartTable');
  await expect(cartTable).toContainText('iphone X');

  // For additional confidence, check for a line item that exactly contains the product name
  const productInCart = page.locator('text=iphone X');
  await expect(productInCart).toBeVisible();
});
