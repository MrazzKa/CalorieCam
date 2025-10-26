export const pick = <T, K extends keyof T>(object: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
};

export const omit = <T, K extends keyof T>(object: T, keys: K[]): Omit<T, K> => {
  const result = { ...object };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

export const deepClone = <T>(object: T): T => {
  if (object === null || typeof object !== 'object') {
    return object;
  }
  
  if (object instanceof Date) {
    return new Date(object.getTime()) as T;
  }
  
  if (object instanceof Array) {
    return object.map(item => deepClone(item)) as T;
  }
  
  if (typeof object === 'object') {
    const cloned = {} as T;
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        cloned[key] = deepClone(object[key]);
      }
    }
    return cloned;
  }
  
  return object;
};

export const deepMerge = <T>(target: T, source: Partial<T>): T => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  
  return result;
};

export const isEmpty = (object: any): boolean => {
  if (object === null || object === undefined) {
    return true;
  }
  
  if (typeof object === 'string' || Array.isArray(object)) {
    return object.length === 0;
  }
  
  if (typeof object === 'object') {
    return Object.keys(object).length === 0;
  }
  
  return false;
};

export const has = (object: any, path: string): boolean => {
  const keys = path.split('.');
  let current = object;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
};

export const get = (object: any, path: string, defaultValue?: any): any => {
  const keys = path.split('.');
  let current = object;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
};

export const set = (object: any, path: string, value: any): any => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = object;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return object;
};

export const unset = (object: any, path: string): boolean => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = object;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  if (current && lastKey in current) {
    delete current[lastKey];
    return true;
  }
  
  return false;
};

export const keys = (object: any): string[] => {
  return Object.keys(object);
};

export const values = <T>(object: Record<string, T>): T[] => {
  return Object.values(object);
};

export const entries = <T>(object: Record<string, T>): [string, T][] => {
  return Object.entries(object);
};

export const invert = <T>(object: Record<string, T>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(object)) {
    result[String(value)] = key;
  }
  return result;
};