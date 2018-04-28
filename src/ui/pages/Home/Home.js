import './Home.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import Link from 'redux-first-router-link'

import NewsOverview from '../../components/NewsOverview/NewsOverview.js'

class Home extends Component {
	render() {
		return (
			<div className="home">
				<p className="quote">"Zelfs het kleinste wat je doet voor het milieu is belangrijk!"<span className="seperator">-</span><span className="attribution">Wubbo Ockels</span></p>
				<p>Wij zijn de Stille Rapers: vrijwilligers die tijdens het wandelen, fietsen en/of varen zwerfvuil meenemen, om op die manier de natuur schoon te houden.</p>
				<p className="intro">Via deze website delen wij onze <Link to={{ type: 'EXPERIENCES' }}>ervaringen</Link> met elkaar en met de buitenwereld, en via de <Link to={{ type: 'MAP' }}>interactieve kaart</Link> weten we elkaar te vinden.</p>
				<NewsOverview type="news" maxItems="6" />
			</div>
		)
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Home)