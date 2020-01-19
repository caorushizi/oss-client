import Bucket from './bucket';

export default class Service {
  public ak: string;
  public sk: string;
  public index = 0;
  public buckets: Bucket[];

  constructor(ak: string, sk: string) {
    this.ak = ak;
    this.sk = sk;
  }

  public getCurrentBucket(): Bucket {
    return this.buckets[this.index];
  }

  public switchBucket(index: number) {
    this.index = index;
  }
}
