import './NewsOverview.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import firebase from '../../../config/firebase.js'
import { isAdmin } from '../../../redux/user.js'
import formCacheActions from '../../../redux/formCache.js'

class NewsOverview extends Component {
	state = {
		newsLoaded: false,
	}

	componentDidMount() {
		// Note that the object is mounted. This is so we can check if SetState is allowed.
		this.mounted = true

		// Load the news, if necessary.
		if (!this.state.newsLoaded) {
			firebase.database().ref(`public/${this.getType()}`).orderByChild('date').limitToLast(this.getMaxItems()).once('value').then((snapshot) => {
				// Read the news and turn it into an array.
				const news = snapshot.val()
				this.news = []
				for (var id in news) {
					news[id].id = id // Remember the ID.
					this.news.push(news[id])
				}
				this.news.sort((a,b) => b.date - a.date) // Sort by the date.

				// If the component is still mounted, show the changes.
				if (this.mounted)
					this.setState({ newsLoaded: true })
			})
		}
	}
	componentWillUnmount() {
		this.mounted = false
	}

	getMaxItems() {
		return parseInt(this.props.maxItems || 6, 10)
	}
	getType() {
		return this.props.type || 'news'
	}

	deleteNews(item) {
		// Check if this is what the user wanted.
		if (!window.confirm(`Weet je zeker dat je het bericht "${item.title}" wilt verwijderen?`))
			return
			
		// Delete it from the storage of this page.
		this.news.splice(this.news.indexOf(item), 1)
		this.forceUpdate()

		// Delete the image from the storage and the record from the database.
		let imgData = item.picture.match(/images%2F(.*)\?/)
		if (imgData) {
			const imgUrl = imgData[1]
			firebase.storage().ref(`images`).child(imgUrl).delete()
		}
		firebase.database().ref(`public/${this.getType()}`).child(item.id).remove()
	}

	render() {
		if (!this.news || this.news.length === 0)
			return <div className="newsOverview"></div>
			
		return (
			<div className="newsOverview">
				{this.news.map(item => this.renderItem(item))}
			</div>
		)
	}
	renderItem(item) {
		let paragraphs = item.story.split(/\n\s*\n/) // Split up the text based on double (or more) enters. These will be separate paragraphs.
		paragraphs = paragraphs.map(paragraph => paragraph.split('\n').map((item, i) => (i === 0 ? item : [<br key={0} />, item]))) // Replace enters by line breaks. Wrap them in arrays to prevent React complaints.
		return (
			<div key={item.id} className="item">
				{item.picture ? <img src={item.picture} alt={item.title} /> : ''}
				<h3 className="title">{item.title}</h3>
				{isAdmin(this.props.user) ? <p className="edit"><a onClick={() => this.props.editNews(item, this.getType())}>Wijzig {this.getType() === 'news' ? 'dit nieuwsbericht' : 'deze ervaring'}</a> - <a onClick={() => this.deleteNews(item)}>Verwijder {this.getType() === 'news' ? 'dit nieuwsbericht' : 'deze ervaring'}</a></p> : ''}
				{paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
			</div>
		)
	}
}

const stateMap = (state) => ({
	user: state.user,
})
const actionMap = (dispatch) => ({
	editNews: (item, type) => {
		dispatch(formCacheActions.storeFormData(item, (type === 'news' ? 'EDITNEWS' : 'EDITEXPERIENCE'))) // Put the data in the form cache.
		dispatch({ type: (type === 'news' ? 'EDITNEWS' : 'EDITEXPERIENCE') }) // Go to the right page.
	},
})
export default connect(stateMap, actionMap)(NewsOverview)