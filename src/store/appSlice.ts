import { createSlice } from "@reduxjs/toolkit";

export const counterSlice = createSlice({
  name: "counter",
  initialState: {
    currApp: "",
  },
  reducers: {
    setCurrApp: (state, action) => {
      state.currApp = action.payload;
    },
  },
});

export const { setCurrApp } = counterSlice.actions;

export default counterSlice.reducer;
