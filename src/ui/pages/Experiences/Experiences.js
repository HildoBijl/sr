import './Experiences.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import NewsOverview from '../../components/NewsOverview/NewsOverview.js'

class Experiences extends Component {
	render() {
		return (
			<div className="home">
				<p className="intro">Tijdens hun tochten komen de Stille Rapers vaak verrassende dingen tegen. Hieronder kun je enkele ervaringen lezen.</p>
				<NewsOverview type="experiences" maxItems="6" />
			</div>
		)
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Experiences)