/*
 * First, set up the actions changing things.
 */

const actions = {
	storeFormData: (data, name) => (
		(dispatch, getState) => dispatch({
			type: 'StoreFormData',
			name: name || getState().location.type,
			data,
		})
	),
	clearFormData: (name) => (
		(dispatch, getState) => dispatch({
			type: 'ClearFormData',
			name: name || getState().location.type,
		})
	),
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