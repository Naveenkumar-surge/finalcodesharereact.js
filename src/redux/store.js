import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "./chatSlice";

export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
  },
});
export default store; 