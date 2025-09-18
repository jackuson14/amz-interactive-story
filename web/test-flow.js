const { chromium } = require('playwright');

async function testFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. Going to Step 1 - Name and Age');
    await page.goto('http://localhost:3000/play/character');
    
    // Fill in name and age
    console.log('2. Filling in character name...');
    await page.fill('#character-name', 'Emma');
    
    console.log('3. Selecting age...');
    await page.selectOption('#character-age', '6');
    
    // Check localStorage after filling
    const localStorage1 = await page.evaluate(() => {
      return {
        character: localStorage.getItem('character_v1')
      };
    });
    console.log('4. localStorage after Step 1:', localStorage1);
    
    // Navigate to Step 2
    console.log('5. Clicking Next: Create Character...');
    await page.click('text="Next: Create Character"');
    
    // Wait for navigation and check current URL
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    console.log('6. Current URL:', currentUrl);
    
    // Check localStorage on appearance page
    const localStorage2 = await page.evaluate(() => {
      return {
        character: localStorage.getItem('character_v1')
      };
    });
    console.log('7. localStorage on Step 2:', localStorage2);
    
    // Navigate to Step 3
    if (currentUrl.includes('/appearance')) {
      console.log('8. On appearance page, selecting a preset character...');
      // Click on "Choose Character" first
      await page.click('text="Choose Character"');
      await page.waitForTimeout(500);
      
      // Click on the first preset character
      await page.click('[data-character-id], .cursor-pointer >> nth=0');
      await page.waitForTimeout(500);
      
      console.log('9. Clicking Next: Choose Story...');
      await page.click('text="Next: Choose Story"');
      await page.waitForTimeout(1000);
    }
    
    const finalUrl = page.url();
    console.log('10. Final URL:', finalUrl);
    
    if (finalUrl.includes('/idea')) {
      // Check localStorage on idea page
      const localStorage3 = await page.evaluate(() => {
        return {
          character: localStorage.getItem('character_v1')
        };
      });
      console.log('11. localStorage on Step 3:', localStorage3);
      
      // Check if name appears in the heading
      const heading = await page.textContent('h3');
      console.log('12. Story heading text:', heading);
      
      // Check console for any errors
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    }
    
    await page.waitForTimeout(5000); // Keep browser open to inspect
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  await browser.close();
}

testFlow();