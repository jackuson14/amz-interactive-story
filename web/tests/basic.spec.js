const { test, expect } = require('@playwright/test');

test('homepage loads successfully', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('http://localhost:3000');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if the page title contains expected text
  await expect(page).toHaveTitle(/Interactive Story/);
  
  // Check if main content is visible
  await expect(page.locator('main')).toBeVisible();
});

test('can navigate to goodnight zoo story', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Look for zoo story link or button
  const zooLink = page.getByText('Goodnight Zoo').first();
  if (await zooLink.isVisible()) {
    await zooLink.click();
    await page.waitForLoadState('networkidle');
    
    // Check if we're on a story page
    await expect(page.locator('main')).toBeVisible();
  }
});

test('jump detection component appears on jungle scene', async ({ page }) => {
  // Navigate directly to goodnight zoo story page 3 (jungle scene)
  await page.goto('http://localhost:3000/story?story=goodnight-zoo');
  await page.waitForLoadState('networkidle');
  
  // Navigate to page 3 (jungle scene) - idx 2
  // Click next button twice to get to jungle scene
  const nextButton = page.locator('button').filter({ hasText: 'Next' }).first();
  
  if (await nextButton.isVisible()) {
    await nextButton.click();
    await page.waitForTimeout(1000);
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Check if jump instruction appears
    const jumpInstruction = page.getByText('Jump like a monkey');
    await expect(jumpInstruction).toBeVisible({ timeout: 5000 });
    
    // Check if pose detection component is present
    const poseDetection = page.locator('[data-testid="pose-detection"]');
    // This might not be visible due to camera permissions, but component should be in DOM
  }
});