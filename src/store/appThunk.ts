import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from ".";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  dispatch: AppDispatch;
  state: RootState;
}>();
