import firebase from '../config/firebase.js'
import settingActions, { defaultSettings } from './settings.js'

/*
 * First, set up the actions changing things.
 */

const setRole = (role) => ({
	type: 'SetRole',
	role,
})

const checkUserData = () => (
	(dispatch, getState) => {
		// Verify that the user is currently logged in.
		const user = getState().user
		if (!isSignedIn(user))
			return

		// Access the database for the current user.
		const privateRef = firebase.database().ref(`private/users/${user.uid}`)
		privateRef.once('value').then((snapshot) => {
			// Verify the database entry.
			let privateUser = snapshot.val()
			if (!privateUser) {
				// The user is not in the database yet. Add him/her.
				privateUser = getDefaultDBUser(user)
				privateRef.set(privateUser)
			} else {
				// The user is in the database. Check if any of the data has changed.
				let change = false
				let update = {}
				if (privateUser.name !== user.name) {
					update.name = user.name
					privateUser.name = user.name
					change = true
				}
				if (privateUser.email !== user.email) {
					update.email = user.email
					privateUser.email = user.email
					change = true
				}
				if (privateUser.picture !== user.picture) {
					update.picture = user.picture
					privateUser.picture = user.picture
					change = true
				}
				if (change) {
					privateRef.update(update)
				}
			}

			// Process the settings and role that were loaded from the database.
			dispatch(settingActions.applySettings(privateUser.settings))
			dispatch(setRole(privateUser.role))

			// Check the public data of the user.
			const publicRef = firebase.database().ref(`public/users/${user.uid}`)
			publicRef.once('value').then((snapshot) => {
				// Verify the database entry.
				let publicUser = snapshot.val()
				let desiredPublicUser = getPublicUser(privateUser)
				if (!publicUser) {
					// The user is not in the database yet. Add him/her.
					publicRef.set(desiredPublicUser)
				} else {
					// The user is in the database. Check if any of the data has changed.
					let change = false
					let update = {}
					if (publicUser.name !== desiredPublicUser.name) {
						update.name = desiredPublicUser.name || null
						change = true
					}
					if (publicUser.email !== desiredPublicUser.email) {
						update.email = desiredPublicUser.email || null
						change = true
					}
					if (publicUser.picture !== desiredPublicUser.picture) {
						update.picture = desiredPublicUser.picture || null
						change = true
					}
					if (change) {
						publicRef.update(update)
					}
				}
			})
		})
	}
)

const actions = {
	// Actions for signing in and out through Firebase authentication.
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
			checkUserData()(dispatch, getState) // Verify that the data in the datastore is valid. Update it if not.
		}
	),
	processRedirectSuccess: (result) =>  ({
		type: 'RedirectSuccess',
		result,
	}),
	processRedirectError: (error) => ({
		type: 'RedirectError',
		error,
	}),

	// Actions for the database tracking of users.
	checkUserData,
	setRole,
	resign: () => (
		(dispatch, getState) => {
			// First call firebase to resign. We assume the command will make it, so we won't wait for confirmation. This is to increase the responsiveness of the website.
			const user = getState().user
			firebase.database().ref(`private/users/${user.uid}`).update({ role: 'user' }).then(() => dispatch(setRole('user')))
		}
	),
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

function getDefaultDBUser(user) {
	return {
		name: user.name,
		email: user.email,
		picture: user.picture,
		role: 'user',
		settings: { ...defaultSettings }
	}
}
function getPublicUser(privateUser) {
	const publicUser = {}
	if (privateUser.settings.showName)
		publicUser.name = privateUser.name
	if (privateUser.settings.showEmail)
		publicUser.email = privateUser.email
	if (privateUser.settings.showPicture)
		publicUser.picture = privateUser.picture
	return publicUser
}

export default actions

/*
 * Second, set up the reducer applying the actions to the state.
 */

export function reducer(user = { ready: false }, action) {
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

		case 'AuthStateChange': { // The user signed in, either manually or from a cached session.
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
				picture: firebaseUser.photoURL,
				uid: firebaseUser.uid,
				role: 'unknown',
				notification: user.notification,
			}
		}

		case 'RedirectSuccess': { // The user signed in manually.
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

		case 'SetRole': {
			return {
				...user,
				role: action.role,
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
export function isRoleKnown(user) {
	return user.role !== 'unknown'
}
export function isAdmin(user) {
	return user.role === 'admin'
}