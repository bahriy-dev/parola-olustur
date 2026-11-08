import {test} from 'node:test';import assert from 'node:assert/strict';
import {TOOL_CONTENT} from '../src/content/tools';
import type {Block,ToolContent} from '../src/content/tools/types';
import {ALL_TOOLS} from '../src/lib/tools-registry';
import {HASH_ALGORITHMS,HASH_CATEGORIES} from '../src/lib/hash/registry';
import {HASH_TOOL_SLUGS} from '../src/lib/hash-tool-routes';

const texts=(c:ToolContent)=>[
 ...c.sections.flatMap(s=>[s.title,...s.blocks.flatMap((b:Block)=>typeof b==='string'?[b]:'list' in b?b.list:'steps' in b?b.steps:'note' in b?[b.note]:'code' in b?[b.code,b.caption??'']:[...b.table.head,...b.table.rows.flat()])]),
 ...(c.faq??[]).flatMap(f=>[f.q,f.a]),
];
const available=ALL_TOOLS.filter(t=>t.status==='available');

test('every available tool has explanatory content with mostly unique text',()=>{
 const owners=new Map<string,Set<string>>();
 for(const [id,c] of Object.entries(TOOL_CONTENT))for(const t of texts(c))owners.set(t,(owners.get(t)??new Set()).add(id));
 for(const tool of available){
  const c=TOOL_CONTENT[tool.id];
  assert.ok(c,`${tool.id}: içerik yok`);
  assert.ok(c.sections.length>=2,`${tool.id}: en az iki bölüm`);
  const unique=texts(c).filter(t=>owners.get(t)!.size===1).join('').length;
  assert.ok(unique>=500,`${tool.id}: yalnız ${unique} karakter özgün metin`);
 }
 for(const id of Object.keys(TOOL_CONTENT))assert.ok(available.some(t=>t.id===id),`${id}: içerik var ama araç kullanılabilir değil`);
});

test('internal links in tool content point to existing, non-redirecting routes',()=>{
 const routes=new Set(['/','/araclar','/hash','/coklu-hash','/hash-dogrulama','/hash-tanimlayici','/toplu-parola','/sss','/gizlilik','/guvenlik-rehberi',
  ...ALL_TOOLS.filter(t=>!HASH_TOOL_SLUGS[t.id]).map(t=>`/araclar/${t.id}`),...HASH_ALGORITHMS.map(a=>`/hash/${a.slug}`),...HASH_CATEGORIES.map(c=>`/hash/kategori/${c.slug}`)]);
 for(const [id,c] of Object.entries(TOOL_CONTENT))for(const t of texts(c))for(const m of t.matchAll(/\]\((\/[^)]*)\)/g))
  assert.ok(routes.has(m[1]),`${id}: kırık bağlantı ${m[1]}`);
});
