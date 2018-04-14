import firebase from '../config/firebase.js'

import { isSignedIn } from './user.js'

/*
 * First, set up the actions changing things.
 */

const actions = {
	setPage: (page) => ({
		type: 'SetMapPage',
		page,
	}),
	setAction: (action) => ({
		type: 'SetMapAction',
		action,
	}),
	setMouseLocation: (location) => ({
		type: 'SetMapMouseLocation',
		location,
	}),
	addPolygonLocation: (location) => ({
		type: 'AddPolygonLocation',
		location,
	}),
	removePolygonLocation: (locationIndex) => ({
		type: 'RemovePolygonLocation',
		locationIndex,
	}),
	confirmPolygon: () => (
		(dispatch, getState) => {
			const polygon = getState().map.currentPolygon
			const user = getState().user
			if (!isSignedIn(user))
				return
			if (isValidPolygon(polygon)) {
				firebase.database().ref(`public/users/${user.uid}/areas`).push(polygon)
				// TODO: ADD TO LOCAL STORAGE IN USER DATA.
			}
			dispatch({ type: 'CancelPolygon' })
		}
	),
	cancelPolygon: () => ({
		type: 'CancelPolygon',
	})
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(state = getDefaultState(), action) {
	switch (action.type) {

		case 'SetMapPage': {
			return {
				...state,
				page: action.page,
			}
		}

		case 'SetMapAction': {
			return {
				...state,
				action: action.action,
			}
		}

		case 'SetMapMouseLocation': {
			return {
				...state,
				mouse: action.location,
			}
		}

		case 'AddPolygonLocation': {
			const currentPolygon = state.currentPolygon.slice(0)
			currentPolygon.push(action.location)
			return {
				...state,
				currentPolygon,
			}
		}

		case 'RemovePolygonLocation': {
			const currentPolygon = state.currentPolygon.slice(0) // Clone the array.
			currentPolygon.splice(action.locationIndex, 1) // Remove an element.
			return {
				...state,
				currentPolygon,
			}
		}

		case 'CancelPolygon': {
			return {
				...state,
				action: 'none',
				currentPolygon: [],
			}
		}

		default: {
			return state
		}
	}
}

function getDefaultState() {
	return {
		page: 'ownAreas', // TODO: Set this to 'fullMap' to make it default to go to the full map.
		action: 'none', // Can be 'none', 'adding' or 'editing'.
		currentPolygon: [], // The coordinates of the polygon that we're currently editing.
	}
}

/*
 * Third, set up getter functions for various useful parameters.
 */

function isValidPolygon(polygon) {
	if (polygon.length <= 2)
		return false
	return true
}
