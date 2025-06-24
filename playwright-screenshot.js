const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewportSize({ width: 1280, height: 720 });
  
  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3000/pt/dashboard', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Wait for content to load
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'dashboard-current.png', fullPage: true });
  console.log('Screenshot saved as dashboard-current.png');
  
  // Get computed styles of a button to check if CSS is applied
  const buttonStyles = await page.evaluate(() => {
    const button = document.querySelector('button');
    if (button) {
      const styles = window.getComputedStyle(button);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        fontSize: styles.fontSize,
        className: button.className
      };
    }
    return null;
  });
  
  console.log('Button styles:', buttonStyles);
  
  // Check if Tailwind classes are in the DOM
  const tailwindClasses = await page.evaluate(() => {
    const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="hover:"]');
    return Array.from(elements).slice(0, 5).map(el => ({
      tagName: el.tagName,
      className: el.className
    }));
  });
  
  console.log('Elements with Tailwind classes:', tailwindClasses);
  
  // Check for CSS files
  const cssFiles = await page.evaluate(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    return Array.from(links).map(link => link.href);
  });
  
  console.log('CSS files loaded:', cssFiles);
  
  // Get any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await browser.close();
})();