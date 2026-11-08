import { computeHash } from './hash/engine';
import { executeTool,type ToolInput } from './tool-execution';
type HashJob = {algorithm: string; input: string | Uint8Array; key?: string};
// `hashes` runs several algorithms over one input so a file is copied into the worker only once.
self.onmessage = async (event: MessageEvent<{tool?: ToolInput; hash?: HashJob; hashes?: Omit<HashJob,'algorithm'> & {algorithms: string[]}}>) => {
  try {
    const {tool,hash,hashes} = event.data;
    const result = tool ? await executeTool(tool)
      : hash ? await computeHash(hash.algorithm,hash.input,{key:hash.key})
      : hashes ? await Promise.all(hashes.algorithms.map(algorithm => computeHash(algorithm,hashes.input,{key:hashes.key})))
      : null;
    self.postMessage({result});
  } catch(error) { self.postMessage({error: error instanceof Error ? error.message : 'Hesaplama başarısız.'}); }
};
