import './About.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

class About extends Component {
	render() {
		return (
			<div className="about">
				<p>[Hier moet een verhaal komen over het ontstaan van de rapers.]</p>
				<h3>Contact</h3>
				<p>Je kunt de Stille Rapers het beste via de mail bereiken, via {this.getMailLink()}.</p>
				<h3>Soortgelijke projecten</h3>
				<p>Er zijn verschillende andere partijen die, net als de Stille Rapers, in actie komen tegen zwerfvuil.</p>
				<ul>
					<li>Persoon 1</li>
					<li>Groep 2</li>
					<li>Organisatie 3</li>
				</ul>
			</div>
		)
	}
	getMailLink() {
		const mail = 'stillerapers@gmail.com'
		return <a href={`mailto: ${mail}`}>{mail}</a>
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(About)