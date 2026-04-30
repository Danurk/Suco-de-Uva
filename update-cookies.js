require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const CHROME_EXECUTABLE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(process.cwd(), 'chrome-temp-profile');

async function updateCookies() {
  console.log('🔄 Atualizando cookies...');

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_EXECUTABLE,
    userDataDir: TEMP_PROFILE,
    args: ['--no-sandbox', '--no-first-run']
  });

  const page = await browser.newPage();
  await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' });

  // Verifica se está logado
  const isLoggedIn = await page.$('a[href*="accounts.google.com"]') === null;
  
  if (!isLoggedIn) {
    console.log('⚠️ Não está logado! Faça login manualmente na janela do Chrome e pressione Enter aqui...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' });
  }

  const cookies = await page.cookies();

  const lines = ['# Netscape HTTP Cookie File'];
  for (const cookie of cookies) {
    const domain = cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`;
    const secure = cookie.secure ? 'TRUE' : 'FALSE';
    const expires = cookie.expires > 0 ? Math.floor(cookie.expires) : 0;
    lines.push(`${domain}\tTRUE\t${cookie.path}\t${secure}\t${expires}\t${cookie.name}\t${cookie.value}`);
  }

  fs.writeFileSync(path.join(__dirname, 'cookies.txt'), lines.join('\n'));
  console.log(`✅ ${cookies.length} cookies salvos!`);

  await browser.close();
}

updateCookies();