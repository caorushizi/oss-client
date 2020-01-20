// TypeScript infers that this function is returning SendMessageAction
import {Action} from 'redux';
import {ThunkAction} from 'redux-thunk';
import {RootState} from '../index';
import {CounterActionTypes, DECREASE, INCREASE} from './types';

export function increase(): CounterActionTypes {
  return {
    type: INCREASE,
    payload: 'newMessage'
  };
}

// TypeScript infers that this function is returning DeleteMessageAction
export function decrease(timestamp: number): CounterActionTypes {
  return {
    type: DECREASE,
    meta: {timestamp}
  };
}
// TODO: 异步
