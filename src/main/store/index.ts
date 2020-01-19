import Service from './service';

export default class Store {
  private index = 0;
  private services: Service[] = [];

  public cur() {
    if (this.index >= this.services.length) {
      this.index = 0;
      throw new Error('超出数组限制，已经重置为第一个元素；');
    }
    return this.services[this.index];
  }

  public setCur(index: number) {
    this.index = index;
  }

  public add(service: Service): number {
    const index = this.services.findIndex((item) => item.ak === service.ak);
    if (index < 0) {
      this.services.push(service);
      return this.services.length;
    } else {
      return index;
    }
  }
}
