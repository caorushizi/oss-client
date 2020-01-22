export interface CounterState {
  count: number;
}

export const INCREASE = "INCREASE";
export const DECREASE = "DECREASE";

interface IncreaseAction {
  type: typeof INCREASE;
  payload: string;
}

interface DecreaseAction {
  type: typeof DECREASE;
  meta: {
    timestamp: number;
  };
}

export type CounterActionTypes = IncreaseAction | DecreaseAction;
