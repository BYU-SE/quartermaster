/**
 * Exposing critical properties to allow determinism in the framework.
 * 
 * The random function to use. Defaults to Math.random().
 * Can be set if a deterministic (seedable) random is needed.
 */
export const MathFunctions: { random: () => number } = {
  random: Math.random
}

export class SeededMath {
  private static rand: () => number;

  static reseed(): void {
    const seed: () => number = this.xmur3("quartermaster")
    SeededMath.rand = this.sfc32(seed(), seed(), seed(), seed())
  }
  static random(): number {
    if (!SeededMath.rand) {
      SeededMath.reseed();
    }
    return SeededMath.rand() as number;
  }
  private static xmur3(str: string): () => number {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function () {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      return (h ^= h >>> 16) >>> 0;
    }
  }
  private static sfc32(a: number, b: number, c: number, d: number): () => number {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
  }
}

/**
 * The normal distribution, using a mean and standard deviation
 * @param mean 
 * @param std 
 */
export function normal(mean: number, std: number): number {
  return Math.floor(standardNormal() * std + mean);
}
/**
 * Helper function for the standard normal
 */
export function standardNormal(): number {
  let u: number = 0;
  let v: number = 0;
  while (u == 0)
    u = MathFunctions.random();
  while (v == 0)
    v = MathFunctions.random();
  const value = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  if (isNaN(value)) {
    console.error("NAN achieved with values", u, v)
  }
  return value
}

/**
 * Calculate the standard deviation
 * @param arr The array of numbers to calculate the standard deviation on.
 * @param mean (optional) An already computed mean of the set of numbers
 */
export function standardDeviation(arr: number[], mean?: number): number {
  const avg = mean || average(arr);
  return Math.sqrt(arr.map(x => (x - avg) ** 2).reduce((sum, cur) => sum + cur, 0) / arr.length);
}


/**
 * The sigmoid function
 * @param value 
 * @param max 
 * @param k 
 */
export function sigmoid(value: number, max: number, k: number = 3) {
  if (value >= max) return 0;
  value /= max;
  return 1 / (1 + Math.pow(1 / value - 1, -k));
}



/**
 * The exponential function of ab^x
 * @param a 
 * @param b 
 * @param x 
 */
export function exponential(a: number, b: number, x: number) {
  return a * b ** x;
}

/**
 * Find the average value of an array of numbers
 * @param numbers The array of numbers to find the average of
 * @returns The average value of the array of numbers
 */
export function average(numbers: number[]) {
  return numbers.reduce((sum: number, cur: number) => sum + cur, 0) / numbers.length;
}