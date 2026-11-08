import {test,expect,type Page} from '@playwright/test';
// Slow phones (and loaded CI runners) show the server HTML before React hydrates. Holding the JS makes that window
// deterministic: what is typed in it must be used, and a click in it must not post the form and wipe the page.
async function openUnhydrated(page:Page,url:string){
 let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route(u=>u.pathname.startsWith('/_next/static/chunks/')&&u.pathname.endsWith('.js'),async route=>{await gate;await route.continue();});
 await page.goto(url,{waitUntil:'commit'});await page.locator('form button[type=submit]').first().waitFor();
 return async()=>{release();await page.waitForFunction(()=>[...document.querySelectorAll('form')].some(f=>Object.keys(f).some(k=>k.startsWith('__react'))));};
}
test('text typed before hydration is the text the tool computes with',async({page})=>{
 const hydrate=await openUnhydrated(page,'/araclar/hotp-generator');
 await page.getByLabel('Gizli anahtar (Base32)',{exact:true}).fill('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');await hydrate();
 await page.getByRole('button',{name:'Kod üret',exact:true}).click();await expect(page.getByLabel('HOTP kodu',{exact:true})).toHaveValue('755224');
});
test('a click before hydration neither reloads the page nor loses the input',async({page})=>{
 const hydrate=await openUnhydrated(page,'/hash');
 await page.getByLabel('Metin',{exact:true}).fill('abc');
 await expect(page.getByRole('button',{name:'Hesapla',exact:true})).toBeDisabled();
 await hydrate();await expect(page.getByLabel('Metin',{exact:true})).toHaveValue('abc');
 await page.getByRole('button',{name:'Hesapla',exact:true}).click();
 await expect(page.getByText('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',{exact:true})).toBeVisible();
});
