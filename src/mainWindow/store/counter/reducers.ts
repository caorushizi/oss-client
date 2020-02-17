import { CounterActionTypes, CounterState, DECREASE, INCREASE } from "./types";

const initialState: CounterState = {
  count: 10
};

export function counterReducer(
  state = initialState,
  action: CounterActionTypes
): CounterState {
  switch (action.type) {
    case INCREASE:
      return { count: state.count + 1 };
    case DECREASE:
      return { count: state.count - 1 };
    default:
      return state;
  }
}
