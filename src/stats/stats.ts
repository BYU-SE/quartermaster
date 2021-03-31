
type Table = Record<string, Line>;
type Line = {
  type: string;
  value: number;
  called: number;
}
type SeriesTable = Record<string, Series>;
type Series = any[]
class Stats {
  private table: Table = {};
  private timeSeries: SeriesTable = {};

  /**
   * Adds a value to the value in a name-value pair in a table. Creates a 
   * name-value pair and adds it to the table if it does not already exist.
   * @param name 
   * @param value 
   */
  add(name: string, value: number) {
    if (!this.table[name]) {
      this.table[name] = { value: 0, called: 0, type: "add" };
    }

    const existing = this.table[name]
    existing.value += value;
    existing.called++;
  }

  /**
   * Sets the value in a name-value pair to the higher number between the passed value
   * and the value in the table. Creates a name-value pair and adds it to the table 
   * if it does not already exist.
   * @param name 
   * @param value 
   */
  max(name: string, value: number) {
    if (!this.table[name]) {
      this.table[name] = { value: 0, called: 0, type: "max" };
    }

    const existing = this.table[name]
    existing.value = Math.max(value, existing.value);
    existing.called++;
  }

  /**
   * Gets the value associated with the name
   * @param name 
   */
  get(name: string): number {
    return this.table[name]?.value || 0;
  }

  /**
   * Gets the time the name-value pair was recorded.
   * @param name 
   */
  getRecorded(name: string): any[] {
    return this.timeSeries[name] || [];
  }

  /**
   * Clear all recorded statistics
   */
  reset(): void {
    this.table = {};
    this.timeSeries = {};
  }

  /**
   * Records a name and value pair in the stats table.
   * @param name 
   * @param values 
   */
  record(name: string, values: any) {
    if (!this.timeSeries[name]) {
      this.timeSeries[name] = [];
    }

    const existing = this.timeSeries[name];
    existing.push(values);
  }

  /**
   * Prints the values in each recorded item in the global stats table
   * along with a time index and the event rate at that index. Prints 
   * the first 31 values by default. 
   * @param extended 
   */
  summary(extended: boolean = false): void {
    const virtual: Table = JSON.parse(JSON.stringify(this.table))

    for (const [key, line] of Object.entries(virtual)) {
      const row = line as any;
      if (line.type == "add")
        row.avg = line.called > 0 ? (line.value / line.called).toFixed(3) : 0
    }
    if (Object.entries(virtual).length > 0) {
      console.log("Stats tracked through the global stats instance")
      console.table(virtual);
    }

    for (const [key, series] of Object.entries(this.timeSeries)) {
      console.log(`Global stats instance table '${key}':`)
      if (series.length > 30 && !extended) {
        console.table(series.slice(0, 30));
        console.log(`...${series.length - 30} rows trimmed.`)
      }
      else
        console.table(series);
    }
  }
}




export const stats = new Stats();