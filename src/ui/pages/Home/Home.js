import './Home.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import firebase from '../../../config/firebase.js'

const numNewsItems = 2

class Home extends Component {
	state = {
		newsLoaded: false,
	}

	componentDidMount() {
		// Note that the object is mounted. This is so we can check if SetState is allowed.
		this.mounted = true

		// Load the news, if necessary.
		if (!this.state.newsLoaded) {
			firebase.database().ref('public/news').orderByChild('date').limitToLast(numNewsItems).once('value').then((snapshot) => {
				// Read the news and turn it into an array.
				const news = snapshot.val()
				this.news = []
				for (var id in news) {
					news[id].id = id // Remember the ID.
					this.news.push(news[id])
				}
				this.news.reverse() // Reverse, so we have the last first.

				// If the component is still mounted, show the changes.
				if (this.mounted)
					this.setState({ newsLoaded: true })
			})
		}
	}
	componentWillUnmount() {
		this.mounted = false
	}

	render() {
		return (
			<div className="home">
				<p className="intro">De Stille Rapers zijn vrijwilligers die de natuur om ons heen schoon houden van zwerfafval. Zonder beloning of vaak zelfs waardering verzamelen ze het vuil dat ze tegenkomen bij hun wandelingen/boottochten, om het op de juiste manier weg te doen.</p>
				{this.renderNews()}
			</div>
		)
	}
	renderNews() {
		if (!this.news || this.news.length === 0)
			return ''

		return (
			<div className="news">
				{this.news.map(item => this.renderNewsItem(item))}
			</div>
		)
	}
	renderNewsItem(item) {
		let paragraphs = item.story.split(/\n\s*\n/) // Split up the text based on double (or more) enters. These will be separate paragraphs.
		paragraphs = paragraphs.map(paragraph => paragraph.split('\n').map((item, i) => (i === 0 ? item : [<br key={0}/>, item]))) // Replace enters by line breaks. Wrap them in arrays to prevent React complaints.
		return (
			<div key={item.id} className="item">
				{item.picture ? <img src={item.picture} alt={item.title} className="clearfix" /> : ''}
				<h3 className="title">{item.title}</h3>
				{paragraphs.map((paragraph,i) => <p key={i}>{paragraph}</p>)}
			</div>
		)
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Home)