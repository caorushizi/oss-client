import Qiniu from './Impl/Qiniu';
import {IObjectStorageService, ObjectStorageServiceType} from './types';

export default class ObjectStorageServiceFactory {

  public static create(
    type: ObjectStorageServiceType,
    ak: string,
    sk: string,
  ): IObjectStorageService {
    switch (type) {
      case ObjectStorageServiceType.Qiniu:
        return new Qiniu(ak, sk);
      default:
        throw Error('not support this oss yet');
    }
  }
}
