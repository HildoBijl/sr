import firebase from '../config/firebase.js'

/*
 * First, set up the actions changing things.
 */

const actions = {
	loadData: () => (
		(dispatch, getState) => {
			// Don't load data when already ordered.
			if (getState().userData.ordered)
				return
			dispatch({ type: 'OrderedUserData' })
			firebase.database().ref('public/users').once('value').then((snapshot) => {
				dispatch({
					type: 'LoadedUserData',
					data: snapshot.val(),
				})
			})
		}
	),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(state = getDefaultState(), action) {
	switch (action.type) {

		case 'OrderedUserData': {
			return {
				...state,
				ordered: true,
			}
		}

		case 'LoadedUserData': {
			// Add the uid to each user, for easy reference.
			const users = action.data
			Object.keys(users).forEach(uid => { users[uid].uid = uid })

			// Set up the result object.
			return {
				ordered: true,
				known: true,
				users,
				lastChange: {
					type: 'LoadedData',
				},
			}
		}

		case 'ApplyColor': {
			if (!state.known)
				return state
			return {
				...state,
				users: {
					...state.users,
					[action.uid]: {
						...state.users[action.uid],
						color: action.color,
					},	
				},
				lastChange: {
					type: 'ApplyColor',
					uid: action.uid,
				}
			}
		}

		case 'AddArea': {
			if (!state.known)
				return state
			const areas = { ...state.users[action.uid].areas } // Clone the areas object for the user.
			areas[action.aid] = action.area // Add the new area.
			return {
				...state,
				users: {
					...state.users,
					[action.uid]: {
						...state.users[action.uid],
						areas,
					}
				},
				lastChange: {
					type: 'AddArea',
					uid: action.uid,
					aid: action.aid,
				},
			}
		}

		default: {
			return {
				...state,
				lastChange: null,
			}
		}
	}
}

function getDefaultState() {
	return {
		ordered: false, // Have we already ordered the data to be loaded?
		known: false, // Do we know the data?
		users: {}, // There is no data yet.
	}
}

/*
 * Third, set up getter functions for various useful parameters.
 */
