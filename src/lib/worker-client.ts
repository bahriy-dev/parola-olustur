export function workerJob<T>(data: unknown, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve,reject) => {
    if (signal?.aborted) { reject(new Error('İşlem iptal edildi.')); return; }
    const worker = new Worker(new URL('./crypto.worker.ts',import.meta.url),{type:'module'});
    const cleanup = () => { clearTimeout(timer); worker.terminate(); signal?.removeEventListener('abort',abort); };
    const abort = () => { cleanup(); reject(new Error('İşlem iptal edildi.')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Hesaplama zaman sınırını aştı.')); },120000);
    signal?.addEventListener('abort',abort,{once:true});
    worker.onmessage = event => { cleanup(); if(event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result as T); };
    worker.onerror = () => {cleanup();reject(new Error('Hesaplama işçisi başlatılamadı. Tarayıcı desteğini kontrol edin.'));};
    worker.postMessage(data);
  });
}
