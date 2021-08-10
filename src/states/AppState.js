import {
  SET_SERVERLESS_URI, SET_CURRENT_TASK, SET_SYNC_CLIENT,
} from './actions';

const initialState = {
  currentTask: null,
  serverlessUri: null,
  syncClient: null
};

export default function reduce(state = initialState, action) {
  switch (action.type) {
    case SET_SERVERLESS_URI:
      return {
        ...state,
        serverlessUri: action.payload
      };
    case SET_CURRENT_TASK:
      return {
        ...state,
        currentTask: action.payload
      };
    case SET_SYNC_CLIENT:
      return {
        ...state,
        syncClient: action.payload
      };
    default:
      return state;
  }
}
