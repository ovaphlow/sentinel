export function reducer(state, action) {
  if (action.type === 'set') {
    return {
      ...state,
      [action.payload.key]: action.payload.value,
    };
  } else {
    return state;
  }
}
