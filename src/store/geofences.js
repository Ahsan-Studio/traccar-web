import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'geofences',
  initialState: {
    items: {},
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => state.items[item.id] = item);
    },
    update(state, action) {
      action.payload.forEach((item) => state.items[item.id] = item);
    },
    setVisibility(state, action) {
      // action.payload = { ids: number[], visible: boolean }
      const { ids, visible } = action.payload;
      ids.forEach((id) => {
        if (state.items[id]) {
          if (!state.items[id].attributes) state.items[id].attributes = {};
          state.items[id].attributes.hide = !visible;
        }
      });
    },
  },
});

export { actions as geofencesActions };
export { reducer as geofencesReducer };
