import { Oss, OssMode, OssType } from "../models/oss";
import { ADD_OSS, AppUnionType } from "../actions/oss.actions";

export interface OssState {
  apps: Oss[];
  mode: OssMode;
  active: string;
}

const initialState: OssState = {
  apps: [
    {
      type: OssType.qiniu,
      name: "七牛云1",
      ak: "WFZv3lqgv3HfybOCLlilvaJAcdUcrUMgPTu4ef_l",
      sk: "cpETDVrg9ZDuN-accUZWdzsseyRTByrmyAne0uih",
    },
  ],
  mode: OssMode.view,
  active: "七牛云1",
};

export default function ossReducer(
  state = initialState,
  action: AppUnionType
): OssState {
  switch (action.type) {
    case ADD_OSS:
      const oss = action.payload;
      return {
        apps: [...state.apps, oss],
        mode: OssMode.add,
        active: oss.name,
      };
    default:
      return state;
  }
}
