const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    let errors = [];
    let warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('error', err => {
      console.error('Page error:', err);
    });
    
    page.on('pageerror', err => {
      console.error('Uncaught exception:', err);
    });
    
    console.log('Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2', timeout: 10000 });
    
    const html = await page.content();
    console.log('Page loaded. HTML length:', html.length);
    
    // Check for root element
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootExists: !!root,
        rootHTML: root ? root.innerHTML.substring(0, 200) : 'No root',
        rootClass: root ? root.className : 'N/A',
        bodyHTML: document.body.innerHTML.substring(0, 200)
      };
    });
    
    console.log('\\n--- Page Structure ---');
    console.log('Root element exists:', rootContent.rootExists);
    console.log('Root content preview:', rootContent.rootHTML);
    console.log('Root class:', rootContent.rootClass);
    
    if (errors.length > 0) {
      console.log('\\n--- ERRORS ---');
      errors.forEach(e => console.log('❌', e));
    }
    
    if (warnings.length > 0) {
      console.log('\\n--- WARNINGS ---');
      warnings.forEach(w => console.log('⚠️', w));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\\n✅ No console errors or warnings');
    }
    
    await browser.close();
  } catch (err) {
    console.error('Diagnostic error:', err.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
