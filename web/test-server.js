const { chromium } = require('playwright');

async function testServer() {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log('Testing http://localhost:3000...');
    await page.goto('http://localhost:3000', { timeout: 5000 });
    
    const title = await page.title();
    console.log('Page title:', title);
    console.log('✅ Server is running and accessible!');
    
    await browser.close();
  } catch (error) {
    console.log('❌ Server test failed:', error.message);
    process.exit(1);
  }
}

testServer();