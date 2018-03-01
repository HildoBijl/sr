const defaultSettings = {}

/*
 * First, set up the actions changing things.
 */
const actions = {}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(settings = defaultSettings, action) {
  switch (action.type) {
		case 'ToDo': {
			return settings
		}

		default: {
      return settings
    }
  }
}

/*
 * Third, set up getter functions for various useful parameters.
 */

