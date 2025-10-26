export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark?: string, endMark?: string): number {
    const start = startMark ? this.marks.get(startMark) : undefined;
    const end = endMark ? this.marks.get(endMark) : Date.now();
    
    if (start === undefined) {
      throw new Error(`Start mark "${startMark}" not found`);
    }
    
    const duration = end - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    
    this.measures.get(name)!.push(duration);
    return duration;
  }

  getAverageMeasure(name: string): number {
    const measures = this.measures.get(name);
    if (!measures || measures.length === 0) {
      return 0;
    }
    
    return measures.reduce((sum, measure) => sum + measure, 0) / measures.length;
  }

  getMeasureCount(name: string): number {
    const measures = this.measures.get(name);
    return measures ? measures.length : 0;
  }

  clearMarks(): void {
    this.marks.clear();
  }

  clearMeasures(): void {
    this.measures.clear();
  }

  clear(): void {
    this.clearMarks();
    this.clearMeasures();
  }

  getReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    for (const [name, measures] of this.measures.entries()) {
      report[name] = {
        count: measures.length,
        average: this.getAverageMeasure(name),
        min: Math.min(...measures),
        max: Math.max(...measures),
        total: measures.reduce((sum, measure) => sum + measure, 0),
      };
    }
    
    return report;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export const measure = <T>(name: string, fn: () => T): T => {
  performanceMonitor.mark(`${name}-start`);
  const result = fn();
  performanceMonitor.mark(`${name}-end`);
  performanceMonitor.measure(name, `${name}-start`, `${name}-end`);
  return result;
};

export const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  performanceMonitor.mark(`${name}-start`);
  const result = await fn();
  performanceMonitor.mark(`${name}-end`);
  performanceMonitor.measure(name, `${name}-start`, `${name}-end`);
  return result;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const requestIdleCallback = (callback: () => void, timeout?: number): number => {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    return window.requestIdleCallback(callback, { timeout });
  }
  
  return setTimeout(callback, 0);
};

export const cancelIdleCallback = (id: number): void => {
  if (typeof window !== 'undefined' && window.cancelIdleCallback) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

export const requestAnimationFrame = (callback: () => void): number => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  
  return setTimeout(callback, 16);
};

export const cancelAnimationFrame = (id: number): void => {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};