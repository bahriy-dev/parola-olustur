import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzePassword,log2BigInt} from '../src/lib/entropy';
import type {RandomPasswordOptions} from '../src/types/password';
test('log2BigInt is exact for small values and finite beyond Number range',()=>{
 assert.equal(log2BigInt(0n),0);
 assert.equal(log2BigInt(1n),0);
 assert.equal(log2BigInt(1024n),10);
 assert.equal(log2BigInt(2n**2000n),2000);
 assert.ok(Math.abs(log2BigInt(3n*2n**1500n)-(1500+Math.log2(3)))<1e-9);
});
test('random entropy stays finite for large custom charsets',()=>{
 const customCharset=Array.from({length:300},(_,i)=>String.fromCodePoint(0x100+i)).join('');
 const randomOptions:RandomPasswordOptions={length:128,lowercase:false,uppercase:false,numbers:false,symbols:false,excludeSimilar:false,noAdjacentDuplicates:false,requireEachCategory:false,customCharset,excludedChars:''};
 const {entropyBits,strengthLevel}=analyzePassword('x'.repeat(128),'random',{randomOptions});
 assert.ok(Math.abs(entropyBits-Math.round(128*Math.log2(300)*10)/10)<0.15,String(entropyBits));
 assert.equal(strengthLevel,'very_strong');
});
