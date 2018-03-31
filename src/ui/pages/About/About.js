import './About.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

class About extends Component {
	render() {
		return (
			<div className="about">

				<p>Nederland heeft tal van mooie natuur om in te wandelen, fietsen en kanoën. Alleen het zwerfvuil dat je vaak tegenkomt is jammer. Je kunt hierover klagen, maar wij ruimen het liever op.</p>

				<h3>De Stille Rapers</h3>

				<p>Wij zijn de Stille Rapers, actief in Noord-Holland ten noorden van het Noordzeekanaal. Tijdens onze tochten, ter voet, op de fiets of op het water, nemen we het vuil mee dat we tegenkomen. Immers, vuil trekt vuil aan, terwijl schoon uitnodigt tot schoon houden. Genietend van de mooie omgeving, combineren we het "nuttige" met het "aangename".</p>

				<p>Zwerfvuil rapen heeft alleen maar voordelen.</p>
				<ol>
					<li>We zijn heerlijk buiten in de natuur.</li>
					<li>We hebben de nodige lichaamsbeweging en voelen ons fit (zonder sportschool).</li>
					<li>We dragen ons steentje bij aan de natuur en het milieu.</li>
				</ol>
				<p>Als iedereen drie stuks zwerfvuil per week opraapt, is er geen zwerfvuil meer.</p>

				<h3>Hoe is het ontstaan?</h3>
				<p>Op 13 oktober 2017 nodigde Het Hoogheemraadschap Noorderkwartier (HHNK) alle Stille Rapers in haar werkgebied uit in Heerhugowaard voor een gezellige en leerzame bijeenkomst. Dat werd enorm gewaardeerd. Veel Stille Rapers willen contact houden met collega Rapers. Pieter Bijl heeft het plan ingediend (en uitgewerkt) om Stille Rapers middels een website en email met elkaar in contact te brengen en ervaringen uit te wisselen. Er zijn ook plannen om jaarlijks een excursie te organiseren voor alle stille rapers in Noord-Holland boven het Noordzeekanaal.</p>

				<h3>Doel</h3>
				<p>Ons doel is elkaar en anderen te stimuleren om regelmatig zwerfvuil te ruimen, zodat het groen en het water schoon blijft. We willen ervaringen uitwisselen en laten zien waar we actief zijn. De excursies zijn onze beloning.</p>

				<h3>Contact</h3>
				<p>Je kunt de Stille Rapers het beste via de mail bereiken, via {this.getMailLink()}.</p>

				{/* TODO */}
				{/* <h3>Soortgelijke projecten</h3>
				<p>Er zijn verschillende andere partijen die, net als de Stille Rapers, in actie komen tegen zwerfvuil.</p>
				<ul>
					<li>Persoon 1</li>
					<li>Groep 2</li>
					<li>Organisatie 3</li>
				</ul> */}
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