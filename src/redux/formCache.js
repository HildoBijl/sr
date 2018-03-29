/*
 * First, set up the actions changing things.
 */

const actions = {
  storeFormData: (name, data) => ({
		type: 'StoreFormData',
		name,
		data,
	}),
	clearFormData: (name) => ({
		type: 'ClearFormData',
		name,
	}),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(state = {}, action) {
  switch (action.type) {
		
    case 'StoreFormData': {
			state = { ...state } // Clone the state (but not a deep clone).
			state[action.name] = action.data
			return state
		}
		
		case 'ClearFormData': {
			state = { ...state } // Clone the state (but not a deep clone).
			delete state[action.name]
			return state
		}

    default: {
      return state
    }
  }
}

/*
 * Third, set up getter functions for various useful parameters.
 */