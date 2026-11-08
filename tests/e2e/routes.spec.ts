import {test,expect} from '@playwright/test';
// Every sitemap URL: 200, self-canonical, unique title/description, matching Open Graph, valid JSON-LD,
// a single H1, no horizontal overflow on a phone and no runtime errors.
test('all sitemap routes render cleanly on mobile',async({page,request},testInfo)=>{
 test.skip(testInfo.project.name!=='mobile','Route sweep runs once, on the phone viewport.');
 test.setTimeout(300000);
 const sitemap=await (await request.get('/sitemap.xml')).text();
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 expect(urls.length).toBeGreaterThan(100);
 const problems:string[]=[];const titles=new Map<string,string>();const descriptions=new Map<string,string>();
 for(const url of urls){
  const path=new URL(url).pathname;
  const errors:string[]=[];// WebKit reports prefetches cancelled by the next navigation as errors; they are not page failures.
  const onError=(e:Error)=>{if(!/_rsc=.*access control checks/.test(e.message))errors.push(e.message);};page.on('pageerror',onError);
  const response=await page.goto(path);
  if(response?.status()!==200)problems.push(`${path}: HTTP ${response?.status()}`);
  const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
  if(canonical!==url)problems.push(`${path}: canonical ${canonical}`);
  const title=await page.title();const description=await page.locator('meta[name="description"]').getAttribute('content')??'';
  if(titles.has(title))problems.push(`${path}: duplicate title with ${titles.get(title)}`);titles.set(title,path);
  if(descriptions.has(description))problems.push(`${path}: duplicate description with ${descriptions.get(description)}`);descriptions.set(description,path);
  if(await page.locator('meta[property="og:url"]').getAttribute('content')!==url)problems.push(`${path}: og:url mismatch`);
  if(await page.locator('meta[property="og:title"]').getAttribute('content')!==title)problems.push(`${path}: og:title mismatch`);
  if(!await page.locator('meta[property="og:image"]').count())problems.push(`${path}: no og:image`);
  for(const block of await page.locator('script[type="application/ld+json"]').allTextContents()){try{JSON.parse(block);}catch{problems.push(`${path}: invalid JSON-LD`);}}
  const h1=await page.locator('h1').count();
  if(h1!==1)problems.push(`${path}: ${h1} h1`);
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))problems.push(`${path}: horizontal overflow`);
  page.off('pageerror',onError);
  if(errors.length)problems.push(`${path}: ${errors.join('; ')}`);
 }
 expect(problems).toEqual([]);
});
test('unknown routes return a real 404',async({request})=>{
 expect((await request.get('/olmayan-sayfa')).status()).toBe(404);
 expect((await request.get('/araclar/olmayan-arac')).status()).toBe(404);
 expect((await request.get('/hash/olmayan')).status()).toBe(404);
});
