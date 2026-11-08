import {test} from 'node:test';import assert from 'node:assert/strict';
import {ALL_TOOLS,UNAVAILABLE_TOOLS} from '../src/lib/tools-registry';
import {EXECUTABLE_TOOL_IDS,GENERATOR_TOOL_IDS} from '../src/lib/tool-capabilities';
import {executeTool} from '../src/lib/tool-execution';
import {generateKeyPair,rsaCrypt,signature,pemBytes,fingerprint,ecdhDemo} from '../src/lib/asymmetric';
import {computeHash} from '../src/lib/hash/engine';
import {HASH_ALGORITHMS} from '../src/lib/hash/registry';
import {readFileSync} from 'node:fs';
test('every catalog tool has explicit capability and status',()=>{
 assert.equal(new Set(ALL_TOOLS.map(t=>t.id)).size,ALL_TOOLS.length);
 for(const tool of ALL_TOOLS)assert.ok(tool.status==='unavailable'?UNAVAILABLE_TOOLS.has(tool.id):[...EXECUTABLE_TOOL_IDS,...GENERATOR_TOOL_IDS].some(id=>id===tool.id),tool.id);
 const engine=readFileSync('src/lib/hash/engine.ts','utf8');
 const cases=[...engine.matchAll(/case '([^']+)':/g)].map(m=>m[1]);
 assert.deepEqual([...new Set(cases)].sort(),HASH_ALGORITHMS.map(a=>a.slug).sort());
});
test('12 hash tool routes use the correct algorithm',async()=>{
 for(const tool of ALL_TOOLS.filter(t=>t.id.startsWith('hash-')&&!['hash-identifier','hash-verifier'].includes(t.id))){
  const slug=tool.id.slice(5).replace(/^sha(1|224|256|384|512)$/,'sha-$1');
  assert.equal(await executeTool({id:tool.id,inputVal:'abc',secondaryInput:'',tertiaryInput:'',optionNumber:0,mode:''}),(await computeHash(slug,'abc')).hash);
 }
});
test('RSA OAEP/PSS, ECDSA, Ed25519, PEM and ECDH',async()=>{
 for(const type of ['RSA','EC','Ed25519'] as const){
  const pair=await generateKeyPair(type);const keys=pair.match(/-----BEGIN [\s\S]+?-----END [A-Z ]+-----/g)!;
  assert.equal(keys.length,2);assert.ok(pemBytes(keys[0]).length>32);assert.match(await fingerprint(keys[0]),/^SHA256:/);
  const signed=await signature(type,'message',keys[1],'',false);
  assert.equal(await signature(type,'message',keys[0],signed,true),'İmza doğrulandı.');
  assert.equal(await signature(type,'changed',keys[0],signed,true),'İmza uyuşmuyor.');
  if(type==='RSA'){const encrypted=await rsaCrypt('İstanbul',keys[0],false);assert.equal(await rsaCrypt(encrypted,keys[1],true),'İstanbul');}
 }
 assert.ok(JSON.parse(await ecdhDemo()).match);
});
test('encoder/decoder tools round-trip and HMAC/checksum variants match references',async()=>{
 const {createHmac}=await import('node:crypto');
 const run=(id:string,inputVal:string,mode='',secondaryInput='',tertiaryInput='')=>executeTool({id,inputVal,secondaryInput,tertiaryInput,optionNumber:0,mode});
 const text='İstanbul <a href="x">&\'🔐';
 assert.equal(await run('hex-tool',await run('hex-tool',text,'encode'),'decode'),text);
 assert.equal(await run('hex-tool','0x48 65:6c6c6f','decode'),'Hello');
 await assert.rejects(run('hex-tool','abc','decode'));
 assert.equal(await run('html-entity-tool',await run('html-entity-tool',text,'encode'),'decode'),text);
 assert.equal(await run('html-entity-tool','&#x1F510; &#60; &unknown;','decode'),'🔐 < &unknown;');
 const message='The quick brown fox',key='secret-key';
 assert.equal(await run('hmac-generator',message,'sha512',key),createHmac('sha512',key).update(message).digest('hex'));
 assert.equal(await run('hmac-generator',message,'sha256',key),createHmac('sha256',key).update(message).digest('hex'));
 assert.equal(await run('hmac-verifier',message,'sha512',key,createHmac('sha512',key).update(message).digest('hex')),'HMAC doğrulandı.');
 assert.equal(await run('checksum-verifier','abc','crc32','352441c2'),'CRC32 doğrulandı.');
 assert.equal(await run('checksum-verifier','abc','adler32','024d0127'),'Adler-32 doğrulandı.');
 assert.equal(await run('checksum-verifier','abd','adler32','024d0127'),'Adler-32 uyuşmuyor.');
});
test('every executable tool returns output or a user-facing validation error for sample input',async()=>{
 const heavy=/bcrypt|argon2|scrypt|pbkdf2/;
 const inputs:Record<string,Partial<{inputVal:string;secondaryInput:string;tertiaryInput:string;optionNumber:number;mode:string}>>={
  'jwt-encoder':{inputVal:'{"sub":"1"}',secondaryInput:'k'.repeat(32)},
  'jwt-decoder':{inputVal:'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig'},
  'jwt-verifier':{inputVal:'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig',secondaryInput:'k'.repeat(32)},
  'totp-generator':{inputVal:'JBSWY3DPEHPK3PXP'},'hotp-generator':{inputVal:'JBSWY3DPEHPK3PXP'},
  'aes-gcm':{inputVal:'metin',secondaryInput:'parola',mode:'encrypt'},
  'vigenere-cipher':{inputVal:'metin',secondaryInput:'KEY',mode:'encrypt'},
  'hkdf-tool':{inputVal:'ikm',secondaryInput:'salt',tertiaryInput:'info'},
  'hmac-generator':{inputVal:'m',secondaryInput:'k'},'hmac-verifier':{inputVal:'m',secondaryInput:'k',tertiaryInput:'00'},
  'checksum-verifier':{inputVal:'abc',secondaryInput:'352441c2'},
  'match-checker':{inputVal:'a',secondaryInput:'a'},'hash-verifier':{inputVal:'abc',secondaryInput:'900150983cd24fb0d6963f7d28e17f72'},
 };
 for(const id of EXECUTABLE_TOOL_IDS){
  if(heavy.test(id)||/rsa|ecdsa|ed25519|pem|fingerprint/.test(id))continue;
  const sample={inputVal:'abc',secondaryInput:'',tertiaryInput:'',optionNumber:0,mode:'',...inputs[id]};
  try{const out=await executeTool({id,...sample});assert.equal(typeof out,'string',id);assert.ok(out.length>0,id);}
  catch(error){assert.ok(error instanceof Error && !(error instanceof TypeError) && !(error instanceof ReferenceError),`${id}: ${error}`);}
 }
});
