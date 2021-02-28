export default class SimpleValue {
  constructor(public value: string, private expires?: number) {
    if (expires && expires * 1000 < Date.now()) {
      // needs more testing
      //this.value = null;
    }
  }
}
