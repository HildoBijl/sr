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
	startAddingArea: () => ({
		type: 'StartAddingArea',
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
				firebase.database().ref(`public/users/${user.uid}/areas`).push(polygon).then(response => {
					const aid = response.key
					dispatch({ type: 'AddArea', area: polygon, uid: user.uid, aid }) // Add it to the UserData object.
					dispatch({ type: 'CancelPolygon' }) // Remove it from the screen.
				})
			}
		}
	),
	cancelPolygon: () => ({
		type: 'CancelPolygon',
	}),
	setHoverArea: (aid, uid) => ({
		type: 'SetHoverArea',
		aid,
		uid,
	}),
	clearHoverArea: () => ({
		type: 'ClearHoverArea',
	}),
	switchActiveArea: (aid) => ({
		type: 'SwitchActiveArea',
		aid,
	}),
	clearActiveArea: () => ({
		type: 'ClearActiveArea',
	}),
	deleteActiveArea: () => (
		(dispatch, getState) => {
			// Extract required data, and do checks which should never happen in the first place.
			const user = getState().user
			const activeArea = getState().map.activeArea
			if (!isSignedIn(user))
				return
			if (!activeArea)
				return

			// Send the request to Firebase to delete the given area.
			firebase.database().ref(`public/users/${user.uid}/areas`).child(activeArea).remove().then(() => {
				dispatch({ type: 'RemoveArea', aid: activeArea, uid: user.uid }) // Remove it from the UserData object.
				dispatch({ type: 'ClearActiveArea' }) // Make sure no area is active.
			})
		}
	),
	showUserData: (uid, xy) => ({
		type: 'ShowUserData',
		uid,
		xy,
	}),
	hideUserData: () => ({
		type: 'HideUserData',
	})
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(state = getDefaultState(), action) {
	switch (action.type) {

		case 'SetMapPage': {
			state = {
				...state,
				page: action.page,
			}
			delete state.hover
			delete state.showUserData
			return state
		}

		case 'SetMapAction': {
			return {
				...state,
				action: action.action,
			}
		}

		case 'StartAddingArea': {
			state = {
				...state,
				action: 'adding',
				currentPolygon: [],
			}
			delete state.hover
			delete state.activeArea
			delete state.mouse
			return state
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
			state = {
				...state,
				currentPolygon,
			}
			delete state.mouse // Remove the mouse location, ensuring that we don't show any marker on the polygon location that we just removed.
			return state
		}

		case 'CancelPolygon': {
			return {
				...state,
				action: 'none',
				currentPolygon: [],
			}
		}

		case 'SetHoverArea': {
			if (state.hover && state.hover.aid === action.aid)
				return state // Don't do anything if the area is the same.
			return {
				...state,
				hover: {
					aid: action.aid,
					uid: action.uid,
				}
			}
		}

		case 'ClearHoverArea': {
			state = { ...state }
			delete state.hover
			return state
		}

		case 'SwitchActiveArea': { // When the user is in edit mode and clicks on an area.
			// If we already selected this area, deselect it.
			if (state.activeArea === action.aid) {
				state = {
					...state,
					action: 'none',
				}
				delete state.activeArea
				return state
			}

			// Select the area.
			return {
				...state,
				action: 'selecting', // This means we have selected an area, but have not edited it yet.
				activeArea: action.aid,
			}
		}

		case 'ClearActiveArea': {
			state = {
				...state,
				action: 'none',
			}
			delete state.activeArea
			return state
		}

		case 'ShowUserData': {
			return {
				...state,
				showUserData: {
					uid: action.uid,
					xy: action.xy,
				},
			}
		}

		case 'HideUserData': {
			state = { ...state }
			delete state.showUserData
			return state
		}

		default: {
			return state
		}
	}
}

function getDefaultState() {
	return {
		page: 'fullMap',
		action: 'none', // Can be 'none', 'adding', 'selecting' or 'editing'.
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
