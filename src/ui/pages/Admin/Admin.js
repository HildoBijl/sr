import './Admin.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import FileUploader from 'react-firebase-file-uploader'
import classnames from 'classnames'

import firebase from '../../../config/firebase.js'

// TODO NEXT: SET UP DATABASE STRUCTURE USING BOLT.
// Firebase has an admin interface, but it can only run server-side. So client-side you cannot really manage users. The only exception is if you make your own database around it, storing everything in your own tables. So that's the plan. 
// Design a database set-up.
// On creating account, create relevant object.
// On log-in, update the relevant user data in a table.
// List this data in the admin overview.
// Optionally, the alternative is to set up cloud functions. Then through cloud functions we can make a call to list all users, and the cloud function then processes it. This may actually also be necessary to post pictures for the news overview. So it could be worthwhile to figure this out too first. 

const pages = [
	'Nieuwe ervaring',
	'Nieuw nieuwsbericht',
	'Gebruikersbeheer',
]

class Admin extends Component {
	state = {
		pageIndex: 0,
		userDataAvailable: false,

		username: '',
		avatar: '',
		isUploading: false,
		progress: 0,
		avatarURL: '',
	}

	componentDidMount() {
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
					firebase.database().ref(`private/users/${uid}`).once('value').then((snapshot) => {
						this.users[uid] = snapshot.val()
					})
				})
				// Note that we at least have some user data.
				this.setState({ userDataAvailable: true })
			})
		}
	}

	setPage(pageIndex) {
		this.setState({
			pageIndex
		})
	}

	handleChangeUsername = (event) => this.setState({ username: event.target.value });
	handleUploadStart = () => this.setState({ isUploading: true, progress: 0 });
	handleProgress = (progress) => this.setState({ progress });
	handleUploadError = (error) => {
		this.setState({ isUploading: false });
		console.error(error);
	}
	handleUploadSuccess = (filename) => {
		this.setState({ avatar: filename, progress: 100, isUploading: false });
		firebase.storage().ref('images').child(filename).getDownloadURL().then(url => this.setState({ avatarURL: url }));
	}

	render() {
		return (
			<div className="admin">
				<div className="adminButtons">
					{pages.map((page, pageIndex) => (
						<div key={pageIndex} className={classnames('btn', { active: this.state.pageIndex === pageIndex })} onClick={() => this.setPage(pageIndex)}>{page}</div>
					))}
				</div>
				{this.renderSubPage()}
			</div>
		)
	}
	renderSubPage() {
		switch (this.state.pageIndex) {
			case 0:
				return (
					<div>
						<p>Nieuwe ervaring</p>
					</div>
				)

			case 1:
				return (
					<div>
						<p>Nieuw nieuwsbericht</p>
						<form>
							<label>Username:</label>
							<input type="text" value={this.state.username} name="username" onChange={this.handleChangeUsername} />
							<label>Avatar:</label>
							{this.state.isUploading &&
								<p>Progress: {this.state.progress}</p>
							}
							{this.state.avatarURL &&
								<img src={this.state.avatarURL} />
							}
							<FileUploader
								accept="image/*"
								name="avatar"
								randomizeFilename
								storageRef={firebase.storage().ref('images')}
								onUploadStart={this.handleUploadStart}
								onUploadError={this.handleUploadError}
								onUploadSuccess={this.handleUploadSuccess}
								onProgress={this.handleProgress}
							/>
						</form>
					</div>
				)

			case 2:
				if (!this.state.userDataAvailable)
					return <div><p>Laden van gebruikers...</p></div>
				const users = []
				for (var uid in this.users) {
					users.push(this.renderUserEntry(uid))
				}
				return <div>{users}</div>

			default:
				return <div><p>Er is iets mis gegaan bij het laden van de pagina. Gebruik de knoppen hierboven om een actie te selecteren.</p></div>
		}
	}
	renderUserEntry(uid) {
		const user = this.users[uid]
		if (user.loading)
			return <div key={uid} className="user">Laden van data voor {user.name || '[anonieme gebruiker]'}...</div>
		return (
			<div key={uid} className="user">
				<div className="name">{user.name}</div>
				<div className="email">{user.email}</div>
				<div className="role">{user.role === 'admin' ? 'Admin' : 'Gebruiker'}</div>
			</div>
		)
	}
}

const stateMap = (state) => ({
	settings: state.settings,
})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Admin)