import './News.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import FileUploader from 'react-firebase-file-uploader'

import firebase from '../../../../config/firebase.js'
import formCacheActions from '../../../../redux/formCache.js'

class News extends Component {
	state = {}

	componentDidMount() {
		// Check if we are editing a news story and have received the data.
		if (this.props.editing) {
			if (!this.props.data.title || !this.props.data.story) {
				return this.props.goToPage(this.props.getType() === 'news' ? 'NEWNEWS' : 'NEWEXPERIENCE')
			}
		}
	}

	handleChangeTitle = (evt) => this.props.storeFormData({ ...this.props.data, title: evt.target.value })
	handleChangeStory = (evt) => this.props.storeFormData({ ...this.props.data, story: evt.target.value })

	handleUploadStart = () => this.props.storeFormData({ ...this.props.data, isUploading: 1, progress: 0, picture: '' }) // isUploading: 1 means we're uploading.
	handleUploadProgress = (progress) => this.props.storeFormData({ ...this.props.data, progress })
	handleUploadError = (error) => this.props.storeFormData({ ...this.props.data, isUploading: 0 })
	handleUploadSuccess = (filename) => {
		this.props.storeFormData({ ...this.props.data, progress: 100, isUploading: 2 }) // isUploading: 2 means the picture has arrived on the server and we're waiting for confirmation.
		firebase.storage().ref('images').child(filename).getDownloadURL().then(url => this.props.storeFormData({ ...this.props.data, picture: url, isUploading: 0, }))
	}

	processEntry = (evt) => {
		// If this function was called by the form, then we get an evt. We have to prevent the form's default behavior, or it will refresh the page.
		if (evt)
			evt.preventDefault()

		// Check if we're uploading a picture. So if we are uploading it, or are waiting for an image URL. If so, do nothing yet.
		const data = this.props.data
		if (data.isUploading > 0)
			return

		// Verify input.
		if (!data.title || data.title.length < 8)
			return this.setState({ notification: 'Er is geen geldige titel.' })
		if (!data.story || data.story.length < 80)
			return this.setState({ notification: 'Er is geen geldig verhaal.' })

		// Verify absence of image, if relevant.
		if (!data.picture) {
			if (!window.confirm('Je verhaal heeft geen bijgevoegde foto. Een afbeelding erbij maakt verhalen altijd een stuk leuker om te lezen. Weet je zeker dat je dit verhaal zonder foto online wilt zetten?'))
				return
		}

		// Store the item. How to do this depends on whether we're editing or adding.
		let promise
		if (this.props.editing) {
			promise = firebase.database().ref(`public/${this.getType()}/${this.props.data.id}`).update({
				title: data.title,
				story: data.story,
				picture: data.picture,
			})
		} else {
			promise = firebase.database().ref(`public/${this.getType()}`).push({
				title: data.title,
				story: data.story,
				picture: data.picture,
				date: firebase.database.ServerValue.TIMESTAMP,
			})
		}
		promise.then(() => {
			this.props.clearFormData()
			this.props.goToPage(this.getType() === 'news' ? 'HOME' : 'EXPERIENCES')
		})
	}

	getType() {
		return this.props.type || 'news'
	}
	getTitle() {
		return this.getType() === 'news' ? 'nieuwsbericht' : 'ervaring'
	}

	render() {
		const data = this.props.data
		return (
			<div className="news">
				<form onSubmit={this.processEntry}>
					{this.state.notification ? <p className="error notification">{this.state.notification}</p> : ''}
					<div className="titleContainer">
						<input type="text" value={data.title || ''} name="title" placeholder="Titel van je stuk" onChange={this.handleChangeTitle} />
					</div>
					{this.renderImageUploader()}
					<div className="storyContainer">
						<textarea name="story" cols="50" rows="10" placeholder="Je verhaal" onChange={this.handleChangeStory} value={data.story || ''}></textarea>
					</div>
					<span className="btn" onClick={() => this.processEntry()} disabled={data.isUploading > 0}>{this.props.editing ? `Wijzig ${this.getTitle()}` : `Voeg ${this.getTitle()} toe`}</span>
				</form>
			</div>
		)
	}

	renderImageUploader() {
		const data = this.props.data

		// Check if we're in the process of uploading a picture.
		if (data.isUploading > 0) {
			return (
				<div className="pictureUploaderContainer uploading">
					<p>
						{data.isUploading === 1 ?
							`Foto wordt verstuurd ... ${data.progress > 0 ? `${data.progress}% is al aangekomen.` : ``}` :
							`Foto wordt opgeslagen ...`}
					</p>
				</div>
			)
		}

		// Check if there is a picture.
		if (data.picture) {
			return (
				<div className="pictureUploaderContainer uploaded">
					<img alt="Foto voor bij het stuk" src={data.picture} />
					{this.renderUploader()}
					<label htmlFor="pictureUploader" className="btn">Wijzig foto</label>
				</div>
			)
		}

		// Nothing is present yet. Render an add button.
		return (
			<div className="pictureUploaderContainer empty">
				{this.renderUploader()}
				<label htmlFor="pictureUploader" className="btn">Voeg een foto toe</label>
			</div>
		)
	}

	renderUploader() {
		return <FileUploader
			accept="image/*"
			name="pictureUploader"
			id="pictureUploader"
			randomizeFilename
			storageRef={firebase.storage().ref('images')}
			onUploadStart={this.handleUploadStart}
			onUploadError={this.handleUploadError}
			onUploadSuccess={this.handleUploadSuccess}
			onProgress={this.handleUploadProgress}
		/>
	}
}

const stateMap = (state) => ({
	editing: state.location.type.substr(0, 4) === 'EDIT', // Are we editing news (true) or adding news (false)?
	data: state.formCache[state.location.type] || {},
})
const actionMap = (dispatch) => ({
	storeFormData: (data) => dispatch(formCacheActions.storeFormData(data)),
	clearFormData: () => dispatch(formCacheActions.clearFormData()),
	goToPage: (page, payload) => dispatch({ type: page, payload }),
})
export default connect(stateMap, actionMap)(News)