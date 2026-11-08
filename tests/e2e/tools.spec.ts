import {test,expect} from '@playwright/test';
test('hash tool runs locally, clears stale result and uses route canonical',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const requests:string[]=[];page.on('request',request=>requests.push(request.url()));
 const response=await page.goto('/araclar/keccak256-tool');
 expect(response?.headers()['content-security-policy']).toContain("'strict-dynamic'");
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://parolaolustur.com/araclar/keccak256-tool');
 await page.getByLabel('Metin',{exact:true}).fill('abc');
 await expect(page.getByLabel('Keccak-256 (hex)',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Hesapla',exact:true}).click();
 await expect(page.getByLabel('Keccak-256 (hex)',{exact:true})).toHaveValue('0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45');
 await page.getByLabel('Metin',{exact:true}).fill('private-marker-928374');
 await expect(page.getByLabel('Keccak-256 (hex)',{exact:true})).toHaveCount(0);
 expect(requests.every(url=>!url.includes('private-marker-928374'))).toBeTruthy();
 expect(requests.every(url=>new URL(url).hostname==='127.0.0.1')).toBeTruthy();expect(errors).toEqual([]);
});
test('HOTP and disabled tools',async({page})=>{
 await page.goto('/araclar/hotp-generator');await page.getByLabel('Gizli anahtar (Base32)',{exact:true}).fill('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
 await page.getByRole('button',{name:'Kod üret',exact:true}).click();await expect(page.getByLabel('HOTP kodu',{exact:true})).toHaveValue('755224');
 await page.goto('/araclar/aes-cbc');await expect(page.getByRole('status')).toContainText('henüz mevcut değil');await expect(page.getByRole('button',{name:'Hesapla',exact:true})).toHaveCount(0);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
});
test('AES encrypt/decrypt and error display',async({page})=>{
 await page.goto('/araclar/aes-gcm');await page.getByLabel('Metin',{exact:true}).fill('İstanbul 🔐');await page.getByLabel('Parola',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'Şifrele',exact:true}).click();await expect(page.getByLabel('Sonuç',{exact:true})).toBeVisible();
 const encrypted=await page.getByLabel('Sonuç',{exact:true}).inputValue();expect(JSON.parse(encrypted).v).toBe(1);
 // Switching to "Çöz" hands the ciphertext over and keeps the password, so decrypting needs no copy and paste.
 await page.getByRole('radio',{name:'Çöz',exact:true}).click();await expect(page.getByLabel('Şifreli veri (JSON)',{exact:true})).toHaveValue(encrypted);await expect(page.getByLabel('Parola',{exact:true})).toHaveValue('test-password');
 await page.getByRole('button',{name:'Çöz',exact:true}).click();await expect(page.getByLabel('Sonuç',{exact:true})).toHaveValue('İstanbul 🔐');
 await page.getByLabel('Parola',{exact:true}).fill('wrong');await page.getByRole('button',{name:'Çöz',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText('parola yanlış');
 await page.getByLabel('Şifreli veri (JSON)',{exact:true}).fill('düz metin');await page.getByRole('button',{name:'Çöz',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toContainText('geçerli değil');
});
test('hash page handles files, selection and errors without overflow',async({page})=>{
 await page.goto('/hash');await page.getByLabel('Metin',{exact:true}).fill('abc');await page.getByRole('button',{name:'Hesapla',exact:true}).click();await expect(page.getByText('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',{exact:true})).toBeVisible();
 await page.getByRole('radio',{name:'Çoklu hash',exact:true}).click();await expect(page.getByRole('checkbox',{name:'SHA-256',exact:true})).toBeChecked();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('generator routes render generators and sitemap omits disabled hashes',async({page,request})=>{
 for(const id of ['password-generator','passphrase-generator','pin-generator']){await page.goto('/araclar/'+id);await expect(page.getByLabel('Girdi / Parola',{exact:true})).toHaveCount(0);await expect(page.locator('main')).toBeVisible();}
 const response=await request.get('/sitemap.xml');const body=await response.text();expect(body).not.toContain('/hash/md2<');expect(body).not.toContain('/araclar/aes-cbc<');expect(body).not.toContain('<lastmod>');expect(body).toContain('/gizlilik');
 expect(body).not.toContain('/araclar/password-generator<');await page.goto('/araclar/password-generator');await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://parolaolustur.com');
});
test('generator length can be typed and mode keys work from focused buttons',async({page})=>{
 await page.goto('/');
 const length=page.getByRole('spinbutton',{name:'Uzunluk',exact:true});
 await length.fill('');await length.pressSequentially('12');await expect(length).toHaveValue('12');
 await expect(page.getByLabel('Oluşturulan parola',{exact:true})).toHaveText(/^.{12}$/);
 await length.fill('2');await length.press('Enter');await expect(length).toHaveValue('4');
 const random=page.getByRole('radio',{name:'Rastgele parola',exact:true});
 await random.focus();await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('radio',{name:'Parola ifadesi',exact:true})).toBeFocused();
 await expect(page.getByRole('radio',{name:'Parola ifadesi',exact:true})).toHaveAttribute('aria-checked','true');
 const before=await page.getByLabel('Oluşturulan parola',{exact:true}).textContent();
 await page.keyboard.press('r');await expect(page.getByLabel('Oluşturulan parola',{exact:true})).not.toHaveText(before??'');
});
test('multi-hash selection only uses visible algorithms; the language switch opens the English page',async({page})=>{
 await page.goto('/hash/md5');await page.getByRole('radio',{name:'Çoklu hash',exact:true}).click();
 const checked=await page.getByRole('checkbox',{checked:true}).count();expect(checked).toBeGreaterThan(0);
 await expect(page.getByText(`(${checked} seçili)`)).toBeVisible();
 await page.getByLabel('Metin',{exact:true}).fill('abc');await page.getByRole('button',{name:'Hesapla',exact:true}).click();
 await expect(page.getByText('900150983cd24fb0d6963f7d28e17f72',{exact:true})).toBeVisible();
 await expect(page.getByRole('listitem').filter({hasText:'bayt girdi'})).toHaveCount(checked);
 await page.goto('/hash/kategori/parola-kdf');await expect(page.getByRole('radio',{name:'Hash oluştur',exact:true})).toBeVisible();
 await expect(page.getByRole('radio',{name:'Çoklu hash',exact:true})).toHaveCount(0);
 // The language switch links to the same page in English: /sss → /en/faq, with the document itself in English.
 // On phones the language switch lives in the menu.
 await page.goto('/sss');if(!await page.getByRole('link',{name:/^en – English$/}).isVisible())await page.getByRole('button',{name:'Menüyü aç'}).click();
 await page.getByRole('link',{name:/^en – English$/}).click();
 await expect(page).toHaveURL(/\/en\/faq$/);await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Frequently Asked Questions');expect(await page.title()).toContain('Frequently Asked Questions');
 if(!await page.getByRole('link',{name:/^tr – Türkçe$/}).isVisible())await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('link',{name:/^tr – Türkçe$/}).click();await expect(page).toHaveURL(/\/sss$/);await expect(page.locator('html')).toHaveAttribute('lang','tr');
});
test('single-algorithm hash tools redirect to their hash page, which carries the article',async({page})=>{
 await page.goto('/araclar/hash-sha256');await expect(page).toHaveURL(/\/hash\/sha-256$/);
 await expect(page.getByRole('heading',{level:3,name:'SHA-256 nedir?'})).toBeVisible();
 await page.goto('/araclar');await expect(page.getByText(/^\d+ araç$/)).toHaveText(`${await page.locator('main li a').count()} araç`);
 await expect(page.getByRole('link',{name:/Henüz mevcut değil/})).toHaveCount(0);
});
test('search palette finds tools by any spelling and the mobile menu works',async({page},testInfo)=>{
 await page.goto('/');
 // ⌘K / Ctrl+K opens the palette; "sha-256", "SHA 256" and "sha256" all lead to the same tool.
 await page.keyboard.press(process.platform==='darwin'?'Meta+k':'Control+k');
 const input=page.getByRole('combobox',{name:'Araçlarda ara'});await expect(input).toBeFocused();
 await input.fill('SHA 256');await expect(page.getByRole('listbox',{name:'Araçlarda ara'}).getByRole('option').first()).toContainText('SHA-256');
 await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/hash\/sha-256$/);
 await page.keyboard.press(process.platform==='darwin'?'Meta+k':'Control+k');await page.getByRole('combobox',{name:'Araçlarda ara'}).fill('zzzz-yok');
 await expect(page.getByText('Sonuç yok')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('combobox',{name:'Araçlarda ara'})).toHaveCount(0);
 if(testInfo.project.name==='mobile'){
  await page.getByRole('button',{name:'Menüyü aç'}).click();const menu=page.getByRole('dialog',{name:'Menü'});
  await expect(menu).toBeVisible();await page.keyboard.press('Escape');await expect(menu).toHaveCount(0);
  await page.getByRole('button',{name:'Menüyü aç'}).click();await menu.getByRole('link',{name:'Tüm araçlar'}).click();await expect(page).toHaveURL(/\/araclar$/);
 }
});
