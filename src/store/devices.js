import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'devices',
  initialState: {
    items: {},
    selectedId: null,
    selectedIds: [], // Multi-select support
    visibility: {}, // { deviceId: boolean } - track marker visibility
    focused: {}, // { deviceId: boolean } - track marker focus state
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => {
        state.items[item.id] = item;
        // Set default visibility to true for new devices
        if (state.visibility[item.id] === undefined) {
          state.visibility[item.id] = true;
        }
        if (state.focused[item.id] === undefined) {
          state.focused[item.id] = false;
        }
      });
    },
    update(state, action) {
      action.payload.forEach((item) => state.items[item.id] = item);
    },
    selectId(state, action) {
      state.selectTime = Date.now();
      state.selectedId = action.payload;
    },
    toggleSelectId(state, action) {
      const deviceId = action.payload;
      const index = state.selectedIds.indexOf(deviceId);
      if (index > -1) {
        state.selectedIds.splice(index, 1);
      } else {
        state.selectedIds.push(deviceId);
      }
    },
    setSelectedIds(state, action) {
      state.selectedIds = action.payload;
    },
    clearSelection(state) {
      state.selectedIds = [];
    },
    remove(state, action) {
      delete state.items[action.payload];
      delete state.visibility[action.payload];
      delete state.focused[action.payload];
      // Remove from selectedIds if present
      const index = state.selectedIds.indexOf(action.payload);
      if (index > -1) {
        state.selectedIds.splice(index, 1);
      }
    },
    add(state, action) {
      state.items[action.payload.id] = action.payload;
      state.visibility[action.payload.id] = true;
      state.focused[action.payload.id] = false;
    },
    toggleVisibility(state, action) {
      const deviceId = action.payload;
      state.visibility[deviceId] = !state.visibility[deviceId];
    },
    setVisibility(state, action) {
      const { deviceId, visible } = action.payload;
      state.visibility[deviceId] = visible;
    },
    setGroupVisibility(state, action) {
      const { deviceIds, visible } = action.payload;
      deviceIds.forEach(deviceId => {
        state.visibility[deviceId] = visible;
      });
    },
    toggleFocused(state, action) {
      const deviceId = action.payload;
      state.focused[deviceId] = !state.focused[deviceId];
    },
    setFocused(state, action) {
      const { deviceId, focused } = action.payload;
      state.focused[deviceId] = focused;
    },
    setGroupFocused(state, action) {
      const { deviceIds, focused } = action.payload;
      deviceIds.forEach(deviceId => {
        state.focused[deviceId] = focused;
      });
    },
  },
});

export { actions as devicesActions };
export { reducer as devicesReducer };
