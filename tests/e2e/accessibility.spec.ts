import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const PAGES=['/','/araclar','/hash/sha-256','/araclar/hmac-generator','/araclar/bcrypt-generator','/araclar/password-generator','/araclar/jwt-decoder','/araclar/aes-gcm','/hash','/toplu-parola','/sss','/gizlilik'];
for(const theme of ['light','dark'] as const){
 test(`WCAG AA on key pages (${theme} theme)`,async({page},testInfo)=>{
  test.setTimeout(120000);
  await page.addInitScript(t=>{try{localStorage.setItem('parola_theme',t);}catch{}},theme);
  for(const path of PAGES){
   await page.goto(path);
   const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   expect(results.violations.map(v=>({path,id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  }
  await page.goto('/hash/sha-256');
  await page.screenshot({path:testInfo.outputPath(`tool-${theme}.png`),fullPage:true});
 });
}
