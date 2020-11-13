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
    u = Math.random();
  while (v == 0)
    v = Math.random();
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
  const avg = mean || arr.reduce((sum, cur) => sum + cur, 0) / arr.length;
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

