import Vdir from '../../lib/vdir/vdir';
import {AppActionTypes, GET_VDIR, SET_VDIR} from './types';

export function setVdir(vdir: Vdir): AppActionTypes {
  return {
    type: SET_VDIR,
    vdir
  };
}

export function getVdir(vdir: Vdir): AppActionTypes {
  return {
    type: GET_VDIR,
  };
}
