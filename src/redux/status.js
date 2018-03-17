/*
 * First, set up the actions changing things.
 */

const actions = {
  setOnlineStatus: (online) => ({
		type: 'SetOnline',
		online
	}),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(status = getDefaultState(), action) {
  switch (action.type) {
		
    case 'SetOnline': {
			if (typeof(action.online) !== 'boolean')
				throw new Error(`Invalid type of "online" parameter. It must be boolean and is ${typeof(action.online)}.`)

      return {
        ...status,
        online: action.online,
      }
    }

    default: {
      return status
    }
  }
}

function getDefaultState() {
	return {
		online: true, // By default, assume that the user is online.
	}
}

/*
 * Third, set up getter functions for various useful parameters.
 */
