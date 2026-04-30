import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modals: {},
  modalData: {},
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { key, data } = action.payload;
      state.modals[key] = true;
      if (data) state.modalData[key] = data;
    },
    closeModal: (state, action) => {
      const key = action.payload;
      state.modals[key] = false;
      delete state.modalData[key];
    },
    closeAllModals: (state) => {
      state.modals = {};
      state.modalData = {};
    },
  },
});

export const { openModal, closeModal, closeAllModals } = modalSlice.actions;
export default modalSlice.reducer;
