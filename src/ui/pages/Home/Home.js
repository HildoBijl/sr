import './Home.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import NewsOverview from '../../components/NewsOverview/NewsOverview.js'

class Home extends Component {
	render() {
		return (
			<div className="home">
				<p className="intro">De Stille Rapers zijn vrijwilligers die de natuur om ons heen schoon houden van zwerfafval. Zonder beloning of vaak zelfs waardering verzamelen ze het vuil dat ze tegenkomen bij hun wandelingen/boottochten, om het op de juiste manier weg te doen.</p>
				<NewsOverview type="news" maxItems="6" />
			</div>
		)
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Home)