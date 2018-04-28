import './Experiences.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import NewsOverview from '../../components/NewsOverview/NewsOverview.js'
import { getMailLink } from '../../../util.js'

class Experiences extends Component {
	render() {
		return (
			<div className="experiences">
				<p>Tijdens de tochten komen de Stille Rapers vaak verrassende dingen tegen. Hieronder kun je enkele ervaringen lezen.</p>
				<p className="intro">Heb je zelf een ervaring die je wilt delen? Stuur hem dan naar {getMailLink()}, het liefst samen met een foto. Dan zetten wij hem online.</p>
				<NewsOverview type="experiences" maxItems="15" />
			</div>
		)
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Experiences)