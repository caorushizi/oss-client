import {Vdir} from '../../lib/vdir';
import {AppActionTypes, AppState, GET_VDIR, SET_VDIR} from './types';

const initialState: AppState = {
  vdir: new Vdir('#')
};

export function appReducer(state = initialState, action: AppActionTypes): AppState {
  switch (action.type) {
    case GET_VDIR:
      return state;
    case SET_VDIR:
      return {...state, ...action.vdir};
    default:
      return state;
  }
}
