import {combineReducers} from 'redux';
import {counterReducer} from './counter/reducers';

export const rootReducer = combineReducers({
  counter: counterReducer,
});

export type RootState = ReturnType<typeof rootReducer>
