
import { type Arguments as CacheKey, serialize, createCacheHelper } from 'swr/_internal';  
import { SWRConfig } from 'swr';  

function createCacheHelperV2<Data>(_k: CacheKey) {
  const [key] = serialize(_k);
  if (!key  || typeof key !== 'string') {
    throw Error('wrong key');
  }

  const [get, set] = SWRConfig.defaultValue.cache ? createCacheHelper(SWRConfig.defaultValue.cache, key) : [];

  return {
    cache: get?.().data as Data | undefined,
    setCache: (data: Data) => set?.({ data }),
  };
} 

const swr = {

  requestControllers: new Map<string, AbortController>(),
  requestIds: new Map<string, number>(),

  async noStaleMutate<K extends CacheKey, Data>(key: K, fetcher: (v: K, signal?: AbortSignal) => Promise<Data>): Promise<[Data | undefined, Error | undefined]> {
    const requestId = (this.requestIds.get(key as string) || 0) + 1;
    this.requestIds.set(key as string, requestId);

    if (this.requestControllers.has(key as string)) {
      this.requestControllers.get(key as string)?.abort();
    }
    const controller = new AbortController();
    this.requestControllers.set(key as string, controller);

    try {
      const res = await fetcher(key as K, controller.signal);
      if (requestId === this.requestIds.get(key as string)) {
        return [res, undefined];
      } else {
        return [undefined, undefined];
      }
    } catch (error) {
      return [undefined, error] as [undefined, Error];
    } finally {
      this.requestControllers.delete(key as string);
    }
  },

  async swrFetch<K extends CacheKey, Data>(key: K, fetcher: (v: K) => Promise<Data>): Promise<[Data | undefined, Error | undefined]> {  
    const { cache, setCache } = createCacheHelperV2<Data>(key);  


    const fetchPromise = fetcher(key)  
      .then((data) => {  
        setCache(data); 
        return [data, undefined] as [Data, undefined];  
      })  
      .catch((error) => {  
        return [undefined, error]  as [undefined, Error];  
      });  

    return cache ? [cache, undefined] : await fetchPromise;  
  }
};  

export default swr;

