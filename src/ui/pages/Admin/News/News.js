import './News.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import FileUploader from 'react-firebase-file-uploader'

import firebase from '../../../../config/firebase.js'
import formCacheActions from '../../../../redux/formCache.js'

class News extends Component {
	state = {}

	handleChangeTitle = (evt) => this.props.storeFormData({ ...this.props.data, title: evt.target.value })
	handleChangeStory = (evt) => this.props.storeFormData({ ...this.props.data, story: evt.target.value })

	handleUploadStart = () => this.props.storeFormData({ ...this.props.data, isUploading: true, progress: 0, picture: '', pictureURL: '' })
	handleUploadProgress = (progress) => this.props.storeFormData({ ...this.props.data, progress })
	handleUploadError = (error) => this.props.storeFormData({ ...this.props.data, isUploading: false })
	handleUploadSuccess = (filename) => {
		this.props.storeFormData({ ...this.props.data, picture: filename, progress: 100, isUploading: false })
		firebase.storage().ref('images').child(filename).getDownloadURL().then(url => this.props.storeFormData({ ...this.props.data, pictureURL: url }))
	}

	processEntry = (evt) => {
		// If this function was called by the form, then we get an evt. We have to prevent the form's default behavior, or it will refresh the page.
		if (evt)
			evt.preventDefault()

		// Check if we're uploading a picture. So if we are uploading it, or are waiting for an image URL. If so, do nothing yet.
		const data = this.props.data
		if (data.isUploading || (data.picture && !data.pictureURL))
			return

		// Verify input.
		if (!data.title || data.title.length < 8)
			return this.setState({ notification: 'Er is geen geldige titel.' })
		if (!data.story || data.story.length < 80)
			return this.setState({ notification: 'Er is geen geldig verhaal.' })

		// Verify absence of image, if relevant.
		if (!data.pictureURL) {
			if (!window.confirm('Je verhaal heeft geen bijgevoegde foto. Een afbeelding erbij maakt verhalen altijd een stuk leuker om te lezen. Weet je zeker dat je dit verhaal zonder foto online wilt zetten?'))
				return
		}

		// Store the item.
		firebase.database().ref(`public/news`).push({
			title: data.title,
			story: data.story,
			picture: data.pictureURL,
			date: firebase.database.ServerValue.TIMESTAMP,
		}).then(() => {
			this.props.clearFormData()
			this.props.goToPage('HOME')
		})
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
					<span className="btn" onClick={() => this.processEntry()} disabled={data.isUploading || (data.picture && !data.pictureURL)}>Voeg nieuwsbericht toe</span>
				</form>
			</div>
		)
	}

	renderImageUploader() {
		const data = this.props.data

		// Check if we're in the process of uploading a picture.
		if (data.isUploading) {
			return (
				<div className="pictureUploaderContainer uploading">
					<p>Foto wordt verstuurd ... {data.progress > 0 ? `${data.progress}% is al aangekomen.` : ``}</p>
				</div>
			)
		}

		// Check if there is a picture.
		if (data.pictureURL) {
			return (
				<div className="pictureUploaderContainer uploaded">
					<img alt="Foto voor bij het stuk" src={data.pictureURL} />
					{this.renderUploader()}
					<label htmlFor="pictureUploader" className="btn">Wijzig foto</label>
				</div>
			)
		}

		// Check if there is a filename. This means that the picture has been uploaded, but we just haven't gotten its URL yet.
		if (data.picture) {
			return (
				<div className="pictureUploaderContainer uploading">
					<p>Foto wordt opgeslagen ...</p>
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
	data: state.formCache.newNews || {},
})
const actionMap = (dispatch) => ({
	storeFormData: (data) => dispatch(formCacheActions.storeFormData('newNews', data)),
	clearFormData: () => dispatch(formCacheActions.clearFormData('newNews')),
	goToPage: (page, payload) => dispatch({ type: page, payload }),
})
export default connect(stateMap, actionMap)(News)