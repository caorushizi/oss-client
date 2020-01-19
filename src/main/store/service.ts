export default class Service {
  public ak: string;
  public sk: string;
  public index = 0;
  public buckets: string[] = [];

  constructor(ak: string, sk: string) {
    this.ak = ak;
    this.sk = sk;
  }

  public getCurrentBucket(): string {
    return this.buckets[this.index];
  }

  public switchBucket(index: number) {
    this.index = index;
  }
}
