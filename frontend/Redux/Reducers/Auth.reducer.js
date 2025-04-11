// Reducers/Auth.reducer.js
import { SET_CURRENT_USER, LOGOUT_USER, AUTH_ERROR } from '../Actions/Auth.actions';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true, // Start with loading true to check auth state
  error: null
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: true,
        user: action.userProfile || action.payload,
        loading: false,
        error: null 
      };
    case LOGOUT_USER:
      return {
        ...initialState,
        loading: false // Set loading to false after logout
      };
    case AUTH_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
}