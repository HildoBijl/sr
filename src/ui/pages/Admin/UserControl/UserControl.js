import './UserControl.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import firebase from '../../../../config/firebase.js'
import { stringCompare } from '../../../../util.js'
import userActions, { isAdmin } from '../../../../redux/user.js'

class UserControl extends Component {
	state = {
		usersLoaded: -1, // The -1 value denotes that we don't even know which users there are, let alone have loaded their data.
	}

	constructor(props) {
		super(props)
		this.promoteUser = this.promoteUser.bind(this)
		this.verifyResignation = this.verifyResignation.bind(this)
	}

	componentDidMount() {
		this.mounted = true // We note that the object is mounted. This is so we can check if SetState is allowed.
		if (!this.state.userDataAvailable) {
			firebase.database().ref('public/users').once('value').then((snapshot) => {
				// Get an array of all uids.
				this.users = snapshot.val()
				this.uidArray = []
				for (var uid in this.users) {
					this.uidArray.push(uid)
				}

				// Extract the private data for all uids.
				this.uidArray.forEach(uid => {
					this.users[uid].loading = true
					this.users[uid].uid = uid
					firebase.database().ref(`private/users/${uid}`).once('value').then((snapshot) => {
						this.users[uid] = snapshot.val()
						this.users[uid].uid = uid
						if (this.mounted) {
							this.setState({
								usersLoaded: this.state.usersLoaded + 1,
							})
						}
					})
				})

				// Note that we at least know which users there are. We just haven't loaded their data yet.
				this.setState({ usersLoaded: 0 })
			})
		}
	}

	componentWillUnmount() {
		this.mounted = false
	}

	promoteUser(user) {
		if (window.confirm(`Weet je zeker dat je ${user.name} beheerder wilt maken van de website? De enige manier om dit weer ongedaan te maken is als ${user.name} zelf weer ontslag neemt als beheerder.\nDe gebruiker krijgt overigens geen automatisch bericht van zijn/haar promotie, dus je mag ${user.name} hier zelf nog een bericht over sturen.`)) {
			// Send the call to Firebase. We simply assume it works out. The app is too basic for complicated connection problem checks.
			firebase.database().ref(`private/users/${user.uid}`).update({ role: 'admin' })

			// Update the data in this app, so the change is shown on the screen.
			user.role = 'admin'
			this.forceUpdate()
		}
	}
	verifyResignation() {
		if (window.confirm('Weet je zeker dat je ontslag wilt nemen als beheerder? Je kunt hierna niet meer bij de beheer-sectie van de website. De enige manier om dit ongedaan te maken is als een andere beheerder je de rechten weer teruggeeft.'))
			this.props.resign()
	}

	render() {
		// Check if we have user data loaded.
		if (!this.state.usersLoaded === -1)
			return <div className="userControl loading"><p>Laden van gebruikers...</p></div>

		// Turn the user data into an array of DOM elements.
		const users = []
		for (var uid in this.users) {
			users.push(this.users[uid])
		}
		const rows = users.sort((a, b) => stringCompare(a.name, b.name)).map(user => this.renderUserEntry(user))

		// Return the result.
		return (
			<div className="userControl">
				{this.renderResignButton()}
				<div className="users">{rows}</div>
			</div>
		)
	}
	renderResignButton() {
		if (!isAdmin(this.props.user))
			return ''
		return (
			<div className="resignButton">
				<p>Je bent beheerder van deze website. Dat betekent dat je nieuwe ervaringen en nieuwsberichten kunt toevoegen, via het menu hierboven.</p>
				<p>Mocht je geen beheerder meer willen zijn, dan kun je <span className="btn" onClick={this.verifyResignation}>ontslag nemen</span>. Je zegt je beheerdersrechten hiermee dan op.</p>
			</div>
		)
	}
	renderUserEntry(user) {
		if (user.loading)
			return <div key={user.uid} className="user">Laden van data voor {user.name || '[anonieme gebruiker]'}...</div>
		return (
			<div key={user.uid} className="user">
				<div className="field name">{user.name}</div>
				<div className="field email">{user.email}</div>
				<div className="field role">{user.role === 'admin' ? 'Beheerder' : <span className="btn promote" onClick={() => this.promoteUser(user)}>+</span>}</div>
			</div>
		)
	}
}

const stateMap = (state) => ({
	user: state.user,
})
const actionMap = (dispatch) => ({
	resign: () => dispatch(userActions.resign()),
})
export default connect(stateMap, actionMap)(UserControl)