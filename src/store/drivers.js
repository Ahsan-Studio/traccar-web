import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'drivers',
  initialState: {
    items: {},
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => state.items[item.id] = item);
    },
    add(state, action) {
      state.items[action.payload.id] = action.payload;
    },
    update(state, action) {
      state.items[action.payload.id] = action.payload;
    },
    remove(state, action) {
      delete state.items[action.payload];
    },
  },
});

export { actions as driversActions };
export { reducer as driversReducer };
