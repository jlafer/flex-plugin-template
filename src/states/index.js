import { combineReducers } from 'redux';

import {
  SET_CURRENT_TASK, SET_SERVERLESS_URI, SET_SYNC_TOKEN
} from './actions';
import appStateReducer from "./AppState";

// TODO give your plugin's redux store a unique namespace
export const namespace = 'plugin-template';

export default combineReducers({
  appState: appStateReducer
});

export const setServerlessUri = (payload) => ({
  type: SET_SERVERLESS_URI, payload
});

export const setSyncToken = (payload) => ({
  type: SET_SYNC_TOKEN, payload
});

export const setCurrentTask = (payload) => ({
  type: SET_CURRENT_TASK, payload
});
