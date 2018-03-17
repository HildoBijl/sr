import firebase from '../config/firebase.js'
import settingActions from './settings.js'

/*
 * First, set up the actions changing things.
 */

const actions = {
	signInGoogle: (redirect) => signIn(new firebase.auth.GoogleAuthProvider(), redirect),
	signInFacebook: (redirect) => signIn(new firebase.auth.FacebookAuthProvider(), redirect),
  signOut: () => (
		(dispatch) => {
			firebase.auth().signOut()
			dispatch({ type: 'SignOut' })
		}
	),
	processAuthStateChange: () => (
		(dispatch, getState) => {
			dispatch({ type: 'AuthStateChange' }) // Process the log-in.
			settingActions.loadSettings()(dispatch, getState) // Load the settings of the user.
		}
	),
	processRedirectSuccess: (result) => ({
		type: 'RedirectSuccess',
		result,
	}),
	processRedirectError: (error) => ({
		type: 'RedirectError',
		error,
	}),
}

function signIn(provider, redirect = false) {
	return (dispatch) => {
		if (redirect) {
			firebase.auth().signInWithRedirect(provider)
		} else {
			firebase.auth().signInWithPopup(provider)
				.then((result) => dispatch({ type: 'RedirectSuccess', result }))
				.catch((error) => dispatch({ type: 'RedirectError', error }))
		}
	}
}

export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(user = {ready: false}, action) {
  switch (action.type) {

    case 'SignOut': {
      return {
				ready: true, 
				notification: {
					message: 'Je bent nu uitgelogd.',
					date: new Date(),
					type: 'info',
				},
			}
    }

    case 'AuthStateChange': {
			// Check if the user signed out. If so, delete the user but keep any potential notification.
			const firebaseUser = firebase.auth().currentUser
			if (!firebaseUser) {
				return {
					ready: true,
					notification: user.notification,
				}
			}
			
			// The user signed in.
			return {
				ready: true,
				name: firebaseUser.displayName,
				email: firebaseUser.email,
				uid: firebaseUser.uid,
				notification: user.notification,
			}
		}
		
		case 'RedirectSuccess': {
			// If this was called without a user, then nothing significant happened.
			if (!action.result.user)
				return user

			// Notify the user that the sign-in was successful.
			return {
				...user,
				notification: {
					message: 'Je bent ingelogd.',
					date: new Date(),
					type: 'info',
				},
			}
		}

		case 'RedirectError': {
			// Update the user notification to give the user some info about what happened. We may extend on this by using the error code.
			const error = action.error
			let message
			console.log(error) // TODO REMOVE
			if (error.credential && error.credential.providerId && error.email)
				message = `Kon niet inloggen bij ${error.credential.providerId} via ${error.email}.`
			else
				message = `Inloggen is mislukt.`

			return {
				...user,
				notification: {
					message: message,
					type: 'error',
					date: new Date(),
				},
			}
		}

    default: {
      return user
    }
  }
}

/*
 * Third, set up getter functions for various useful parameters.
 */

 export function isFirebaseReady(user) {
	 return user.ready
 }
 export function isSignedIn(user) {
	 return !!user.uid
 }