const encoder=new TextEncoder();
export function pemBytes(text:string):Uint8Array<ArrayBuffer> {
 const match=text.trim().match(/^-----BEGIN (PUBLIC KEY|PRIVATE KEY|CERTIFICATE)-----\s*([A-Za-z0-9+/=\s]+)\s*-----END \1-----$/);
 if(!match)throw new Error('SPKI/PKCS#8/sertifika PEM bloğu bekleniyor.');
 return Uint8Array.from(atob(match[2].replace(/\s/g,'')),c=>c.charCodeAt(0));
}
const b64=(bytes:ArrayBuffer)=>btoa(Array.from(new Uint8Array(bytes),b=>String.fromCharCode(b)).join(''));
const pem=(label:string,data:ArrayBuffer)=>`-----BEGIN ${label}-----\n${b64(data).match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`;
async function exportPair(pair:CryptoKeyPair) {return `${pem('PUBLIC KEY',await crypto.subtle.exportKey('spki',pair.publicKey))}\n\n${pem('PRIVATE KEY',await crypto.subtle.exportKey('pkcs8',pair.privateKey))}`;}
export async function generateKeyPair(type:'RSA'|'EC'|'Ed25519'):Promise<string> {
 if(type==='RSA') return exportPair(await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:3072,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']));
 if(type==='EC') return exportPair(await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']));
 return exportPair(await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']) as CryptoKeyPair);
}
export async function rsaCrypt(input:string,key:string,decrypt:boolean):Promise<string> {
 if(decrypt&&!key.includes('-----BEGIN PRIVATE KEY-----'))throw new Error('Çözmek için özel anahtar (-----BEGIN PRIVATE KEY-----) gerekli.');
 if(!decrypt&&!key.includes('-----BEGIN PUBLIC KEY-----'))throw new Error('Şifrelemek için açık anahtar (-----BEGIN PUBLIC KEY-----) gerekli.');
 const imported=await crypto.subtle.importKey(decrypt?'pkcs8':'spki',pemBytes(key),{name:'RSA-OAEP',hash:'SHA-256'},false,decrypt?['decrypt']:['encrypt']);
 if(decrypt){
  let bytes:Uint8Array<ArrayBuffer>;
  try{bytes=Uint8Array.from(atob(input.trim()),c=>c.charCodeAt(0));}catch{throw new Error('Şifreli metin geçerli Base64 değil. Şifreleme çıktısının tamamını yapıştırın.');}
  let plain:ArrayBuffer;
  try{plain=await crypto.subtle.decrypt('RSA-OAEP',imported,bytes);}catch{throw new Error('Çözülemedi: özel anahtar bu açık anahtarın eşi değil ya da şifreli metin bozuk.');}
  return new TextDecoder('utf-8',{fatal:true}).decode(plain);
 }
 return b64(await crypto.subtle.encrypt('RSA-OAEP',imported,encoder.encode(input)));
}
export async function signature(type:'RSA'|'EC'|'Ed25519',input:string,key:string,signature:string,verify:boolean):Promise<string> {
 const algorithm=type==='RSA'?{name:'RSA-PSS',hash:'SHA-256'}:type==='EC'?{name:'ECDSA',namedCurve:'P-256'}:{name:'Ed25519'};
 const operation=type==='RSA'?{name:'RSA-PSS',saltLength:32}:type==='EC'?{name:'ECDSA',hash:'SHA-256'}:{name:'Ed25519'};
 const imported=await crypto.subtle.importKey(verify?'spki':'pkcs8',pemBytes(key),algorithm,false,verify?['verify']:['sign']);
 if(verify)return await crypto.subtle.verify(operation,imported,Uint8Array.from(atob(signature),c=>c.charCodeAt(0)),encoder.encode(input))?'İmza doğrulandı.':'İmza uyuşmuyor.';
 return b64(await crypto.subtle.sign(operation,imported,encoder.encode(input)));
}
export async function fingerprint(input:string):Promise<string> {
 if(!input.trim().startsWith('-----BEGIN PUBLIC KEY-----'))throw new Error('SPKI PUBLIC KEY gerekli.');
 const bytes=pemBytes(input);
 return 'SHA256:'+b64(await crypto.subtle.digest('SHA-256',bytes));
}
export async function ecdhDemo():Promise<string> {
 const algorithm={name:'ECDH',namedCurve:'P-256'};
 const a=await crypto.subtle.generateKey(algorithm,false,['deriveBits']),b=await crypto.subtle.generateKey(algorithm,false,['deriveBits']);
 const first=await crypto.subtle.deriveBits({name:'ECDH',public:b.publicKey},a.privateKey,256);
 const second=await crypto.subtle.deriveBits({name:'ECDH',public:a.publicKey},b.privateKey,256);
 return JSON.stringify({curve:'P-256',match:b64(first)===b64(second),note:'Geçici anahtarlarla eğitim demosu; ortak sır gösterilmez.'});
}
