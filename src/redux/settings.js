import firebase from '../config/firebase.js'
import { isSignedIn } from './user.js'

const defaultSettings = {
	showEmail: false, // TODO: EXPAND ON THIS.
}

/*
 * First, set up the actions changing things.
 */

const actions = {
	applySetting: (setting) => (
    (dispatch, getState) => dispatch({
			type: 'ApplySetting',
			setting,
			source: 'user',
			user: getState().user,
		})
	),
	loadSettings: () => (
		(dispatch, getState) => {
			const user = getState().user
			if (!isSignedIn(user))
				return
			firebase.database().ref(`${user.uid}/settings`).once('value').then((snapshot) => {
				dispatch({
					type: 'ApplySetting',
					source: 'firebase',
					setting: snapshot.val()
				})
			})
		}
	),
}
export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(settings = {}, action) {
  switch (action.type) {

    case 'ApplySetting': {
			const newSetting = action.setting

			// Check if the settings are valid.
			if (!isValidSetting(newSetting))
				throw new Error(`Tried to set an invalid setting. The provided object was: ${JSON.stringify(newSetting)}`)

			// If the user applied this new setting (and it doesn't come from Firebase directly) then send it over to Firebase. Do check if the user is actually signed in so we know where to send it.
			if (action.source === 'user') {
				if (!isSignedIn(action.user))
					throw new Error(`Tried to apply a setting, but the user is not signed in.`)
				firebase.database().ref(`${action.user.uid}/settings`).update(newSetting)
			}

			// Overwrite existing settings.
			return {
				...settings,
				...newSetting,
			}
		}

		default: {
      return settings
    }
  }
}

function isValidSetting(setting) {
	for (var key in setting) {
		if (setting.hasOwnProperty(key) && !defaultSettings.hasOwnProperty(key))
			return false
	}
	return true
}

/*
 * Third, set up getter functions for various useful parameters.
 */

export function getSettings(definedSettings) {
	return {
		...defaultSettings,
		...definedSettings,
	}
}
