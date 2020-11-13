
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
  add(name: string, value: number) {
    if (!this.table[name]) {
      this.table[name] = { value: 0, called: 0, type: "add" };
    }

    const existing = this.table[name]
    existing.value += value;
    existing.called++;
  }

  max(name: string, value: number) {
    if (!this.table[name]) {
      this.table[name] = { value: 0, called: 0, type: "max" };
    }

    const existing = this.table[name]
    existing.value = Math.max(value, existing.value);
    existing.called++;
  }

  get(name: string): number {
    return this.table[name]?.value || 0;
  }
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

  record(name: string, values: any) {
    if (!this.timeSeries[name]) {
      this.timeSeries[name] = [];
    }

    const existing = this.timeSeries[name];
    existing.push(values);
  }

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