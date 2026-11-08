import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac,pbkdf2Sync,scryptSync} from 'node:crypto';
import {computeHash} from '../src/lib/hash/engine';
import {HASH_ALGORITHMS} from '../src/lib/hash/registry';
import {generateRandomPassword,generatePin,generatePassphrase,getSecureRandomInt} from '../src/lib/crypto';
import {generateHotp,generateTotp,createJwt,verifyJwtSignature,decodeJwt,validateJwtClaims,aesGcmEncrypt,aesGcmDecrypt,generateNanoId,generateUuidV7} from '../src/lib/tools-engine';
import {generateKdf,verifyKdf} from '../src/lib/kdf';
import {executeTool} from '../src/lib/tool-execution';
import {identifyHash} from '../src/lib/hash/identifier';
import {analyzePassword} from '../src/lib/entropy';
const options={length:24,lowercase:true,uppercase:true,numbers:true,symbols:true,excludeSimilar:false,noAdjacentDuplicates:true,requireEachCategory:true,customCharset:'',excludedChars:''};
test('password and PIN constraints never silently degrade',()=>{
  assert.throws(()=>generateRandomPassword({...options,customCharset:'abc',excludedChars:'abc'}));
  assert.throws(()=>generateRandomPassword({...options,customCharset:'a'}));
  assert.throws(()=>generatePin({length:6,allowRepeat:true,allowSequential:false,excludedDigits:'0123456789'}));
  assert.throws(()=>generatePin({length:11,allowRepeat:false,allowSequential:true,excludedDigits:''}));
  for(let i=0;i<100;i++) {
    const p=generateRandomPassword(options); assert.equal(p.length,24);assert.match(p,/[a-z]/);assert.match(p,/[A-Z]/);assert.match(p,/[0-9]/);assert.match(p,/[^a-z0-9]/i);assert.doesNotMatch(p,/(.)\1/);
    const pin=generatePin({length:8,allowRepeat:false,allowSequential:false,excludedDigits:'09'});assert.equal(new Set(pin).size,8);assert.doesNotMatch(pin,/[09]/);
    for(let j=2;j<pin.length;j++)assert.ok(!(Math.abs(Number(pin[j])-Number(pin[j-1]))===1 && Number(pin[j])-Number(pin[j-1])===Number(pin[j-1])-Number(pin[j-2])));
  }
  for(const n of [0,-1,NaN,Infinity,1.1,2**32+1])assert.throws(()=>getSecureRandomInt(n));
});
test('passphrase selection and entropy respect sampling without replacement',()=>{
  const o={wordCount:10,separator:'-' as const,capitalize:false,addNumber:false,addSymbol:false,language:'en' as const};
  const p=generatePassphrase(o);assert.equal(new Set(p.split('-')).size,10);
  assert.equal(analyzePassword(p,'passphrase',{passphraseOptions:o}).entropyBits,analyzePassword(p,'passphrase',{passphraseOptions:{...o,capitalize:true}}).entropyBits);
});
const hashMap:Record<string,string>={'md5':'md5','sha-1':'sha1','sha-224':'sha224','sha-256':'sha256','sha-384':'sha384','sha-512':'sha512','sha-512-224':'sha512-224','sha-512-256':'sha512-256','sha3-224':'sha3-224','sha3-256':'sha3-256','sha3-384':'sha3-384','sha3-512':'sha3-512','blake2b':'blake2b512','blake2s':'blake2s256','ripemd-160':'ripemd160'};
for(const [slug,reference] of Object.entries(hashMap))test(`independent OpenSSL reference: ${slug}`,async()=>{
 for(const input of ['', 'abc','İstanbul 🔐','x'.repeat(1025)])assert.equal((await computeHash(slug,input)).hash,createHash(reference).update(input).digest('hex'));
});
for(const alg of ['sha256','sha512','sha384','sha1','md5'])test(`HMAC ${alg}`,async()=>assert.equal((await computeHash('hmac-'+alg,'abc',{key:'test-key'})).hash,createHmac(alg,'test-key').update('abc').digest('hex')));
test('removed algorithms and unknown tools reject explicitly',async()=>{
 for(const alg of ['md2','md4','md6','sha-0','siphash-2-4','whirlpool','foobar']){assert.ok(!HASH_ALGORITHMS.some(a=>a.slug===alg));await assert.rejects(computeHash(alg,'abc'));}
 await assert.rejects(computeHash('hmac-sha256','abc'));
 await assert.rejects(executeTool({id:'foobar',inputVal:'abc',secondaryInput:'',tertiaryInput:'',optionNumber:0,mode:''}));
});
test('checksum reference vectors',async()=>{
 for(const [slug,input,expected] of [['crc32','123456789','cbf43926'],['crc32c','123456789','e3069283'],['adler32','Wikipedia','11e60398'],['fnv-1a-32','hello','4f9f2cab'],['fnv-1a-64','hello','a430d84680aabd0b'],['murmurhash3-x86-32','foo','f6a5c420']])assert.equal((await computeHash(slug,input)).hash,expected);
});
test('HOTP RFC 4226 and TOTP RFC 6238 SHA1 vectors',()=>{
 const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
 ['755224','287082','359152','969429','338314','254676','287922','162583','399871','520489'].forEach((expected,i)=>assert.equal(generateHotp(secret,i),expected));
 for(const [time,expected] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']] as const)assert.equal(generateTotp(secret,30,time,8).token,expected);
});
test('JWT UTF8, fixed algorithm, signature and claims separated',()=>{
 const secret='a'.repeat(32), token=createJwt({name:'İstanbul 🔐',exp:10},secret);
 assert.equal((decodeJwt(token).payload as {name:string}).name,'İstanbul 🔐');assert.ok(verifyJwtSignature(token,secret));
 assert.equal(token.split('.')[2],createHmac('sha256',secret).update(token.split('.').slice(0,2).join('.')).digest('base64url'));
 assert.ok(!validateJwtClaims(decodeJwt(token).payload,undefined,undefined,11).valid);
 assert.throws(()=>createJwt({},secret,'none'));assert.ok(!verifyJwtSignature(createJwt({},secret,'HS512'),secret));
 assert.ok(!verifyJwtSignature(token+'x',secret));assert.ok(!validateJwtClaims({iss:'a',aud:'b'},'x','b').valid);
});
test('AES versioned roundtrip, salt randomness, tamper and wrong password rejection',async()=>{
 const a=await aesGcmEncrypt('İstanbul 🔐','passphrase'),b=await aesGcmEncrypt('İstanbul 🔐','passphrase');assert.notEqual(a,b);
 assert.equal(await aesGcmDecrypt(a,'passphrase'),'İstanbul 🔐');await assert.rejects(aesGcmDecrypt(a,'wrong'));
 const envelope=JSON.parse(a);envelope.ciphertext=(envelope.ciphertext[0]==='A'?'B':'A')+envelope.ciphertext.slice(1);await assert.rejects(aesGcmDecrypt(JSON.stringify(envelope),'passphrase'));
});
test('KDF encoded hashes roundtrip and independently agree on scrypt/PBKDF2',()=>{
 for(const type of ['argon2id','argon2i','argon2d','scrypt','pbkdf2-sha256','pbkdf2-sha512','pbkdf2-sha1','bcrypt'] as const){
   const hash=generateKdf(type,'test-password');assert.ok(verifyKdf('test-password',hash));assert.ok(!verifyKdf('wrong',hash));
   if(type.startsWith('pbkdf2')){const [, ,params,salt,out]=hash.split('$');assert.equal(pbkdf2Sync('test-password',Buffer.from(salt,'base64'),Number(params.slice(2)),32,type.slice(7)).toString('base64url'),Buffer.from(out,'base64').toString('base64url'));}
   if(type==='scrypt'){const parts=hash.split('$');assert.equal(scryptSync('test-password',Buffer.from(parts[3],'base64'),32,{N:131072,r:8,p:1,maxmem:256*1024*1024}).toString('hex'),Buffer.from(parts[4],'base64').toString('hex'));}
 }
 const a=generateKdf('argon2id','same'),b=generateKdf('argon2id','same');assert.notEqual(a,b);assert.equal(identifyHash(a)[0].algorithm.slug,'argon2id');
 assert.throws(()=>verifyKdf('password','$argon2id$v=19$m=999999999,t=2,p=1$c2FsdHNhbHQ$YWJj'));
});
test('identifiers and Keccak regression',async()=>{
 assert.match(generateNanoId(),/^[A-Za-z0-9_-]{21}$/);assert.match(generateUuidV7(),/^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
 assert.equal(await executeTool({id:'keccak256-tool',inputVal:'',secondaryInput:'',tertiaryInput:'',optionNumber:0,mode:''}),'0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
});
test('BLAKE reference vectors and SHAKE differential coverage',async()=>{
 // BLAKE submission vectors reproduced by noble-hashes/test/blake.test.ts.
 const vectors:Record<string,string>={
 'blake-224':'7dc5313b1c04512a174bd6503b89607aecbee0903d40a8a569c94eed',
 'blake-256':'716f6e863f744b9ac22c97ec7b76ea5f5908bc5b2f67c61510bfc4751384ea7a',
 'blake-384':'c6cbd89c926ab525c242e6621f2f5fa73aa4afe3d9e24aed727faaadd6af38b620bdb623dd2b4788b1c8086984af8706',
 'blake-512':'a8cfbbd73726062df0c6864dda65defe58ef0cc52a5625090fa17601e1eecd1b628e94f396ae402a00acc9eab77b4d4c2e852aaaa25a636d80af3fc7913ef5b8',
 // BLAKE3-team/BLAKE3 test_vectors.json, input_len=0; Keccak team's KT128 empty vector.
 'blake3':'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
 'kangarootwelve':'1ac2d450fc3b4205d19da7bfca1b37513c0803577ac7167f06fe2ce1f0ef39e5'};
 for(const [slug,expected] of Object.entries(vectors))assert.equal((await computeHash(slug,'')).hash,expected);
 for(const [slug,reference,length] of [['shake128','shake128',32],['shake256','shake256',64],['cshake128','shake128',32],['cshake256','shake256',64]] as const)assert.equal((await computeHash(slug,'abc')).hash,createHash(reference,{outputLength:length}).update('abc').digest('hex'));
 assert.equal((await computeHash('md5-md5','abc')).hash,createHash('md5').update(createHash('md5').update('abc').digest('hex')).digest('hex'));
 assert.equal((await computeHash('md5-sha1','abc')).hash,createHash('md5').update('abc').digest('hex')+createHash('sha1').update('abc').digest('hex'));
});
