import './About.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import { getMailLink } from '../../../util.js'
import NHN from '../../img/NHN.svg'

class About extends Component {
	render() {
		return (
			<div className="about">

				<img src={NHN} className="gebied top" alt="Wij zijn actief in Noord-Holland boven het Noordzeekanaal" />

				<p>Nederland heeft tal van mooie natuur om in te wandelen, fietsen en varen. Helaas ligt er veel zwerfvuil in de bermen en in het water. Je kunt hierover klagen, maar wij ruimen het liever op.</p>

				<h3>De Stille Rapers</h3>

				<p>Wij zijn de Stille Rapers, actief in Noord-Holland ten noorden van het Noordzeekanaal. Tijdens onze tochten, te voet, met de fiets of op het water, nemen we het vuil mee dat we tegenkomen. Immers, vuil trekt vuil aan, terwijl schoon uitnodigt tot schoon houden. Genietend van de mooie omgeving, combineren we het "nuttige" met het "aangename".</p>

				<img src={NHN} className="gebied middle" alt="Wij zijn actief in Noord-Holland boven het Noordzeekanaal" />

				<p>Zwerfvuil rapen heeft alleen maar voordelen:</p>
				<ol>
					<li>We zijn heerlijk buiten in de natuur.</li>
					<li>We hebben de nodige lichaamsbeweging en voelen ons fit (zonder sportschool).</li>
					<li>We dragen ons steentje bij aan de natuur en het milieu.</li>
				</ol>
				<p>Als iedereen drie stuks zwerfvuil per week opraapt, is er geen zwerfvuil meer.</p>

				<h3>Hoe is het ontstaan?</h3>
				<p>Op 13 oktober 2017 nodigde het Hoogheemraadschap Hollands Noorderkwartier (HHNK) alle Stille Rapers in haar werkgebied uit in Heerhugowaard voor een gezellige en leerzame bijeenkomst. Dat werd enorm gewaardeerd. Veel Stille Rapers willen contact houden met collega Rapers. Pieter Bijl heeft het plan ingediend (en uitgewerkt) om Stille Rapers middels een website en email met elkaar in contact te brengen en ervaringen uit te wisselen. Er zijn ook plannen om jaarlijks een excursie te organiseren voor alle stille rapers in Noord-Holland boven het Noordzeekanaal.</p>

				<h3>Doel</h3>
				<p>Ons doel is elkaar en anderen te stimuleren om regelmatig zwerfvuil te ruimen, opdat het groen en het water schoon blijft. We willen ervaringen uitwisselen en laten zien waar we actief zijn. De excursies zijn onze beloning.</p>

				<h3>Contact</h3>
				<p>Je kunt de Stille Rapers het beste via de mail bereiken, via {getMailLink()}.</p>

				<h3>Andere zwerfvuil opruim initiatieven</h3>
				<p>Er zijn verschillende andere partijen die, net als de Stille Rapers, in actie komen tegen zwerfvuil.</p>
				<ul>
					<li><a href="https://www.helemaalgroen.nl/" target="_blank" rel="noopener noreferrer">Helemaal Groen</a> is een app, vooral gebruikt in het oosten van het land, waarmee je tijdens een rondje zwerfvuil rapen kunt bijhouden waar je loopt en dit naar anderen kunt communiceren.</li>
					<li><a href="https://www.lovenotwaste.com/" target="_blank" rel="noopener noreferrer">Love Not Waste</a> organiseert clean-ups en recycleprojecten voor kinderen en bedrijven.</li>
					<li>De <a href="https://statiegeldalliantie.org/" target="_blank" rel="noopener noreferrer">Statiegeld Alliantie</a> streeft naar de uitbreiding van het statiegeldsysteem naar blikjes en alle (grote en kleine) PET-flessen. Het doel is om zwerfvuil hiermee tegen te gaan. Daar staan wij natuurlijk volledig achter!</li>
					<li>De Zaanse Schonen is een groep wandelaars (vooral omgeving Krommenie) die zich elke week verzamelt om hun omgeving schoon te houden. Je kunt ze vinden via hun <a href="https://www.facebook.com/ZaanseSchonen/" target="_blank" rel="noopener noreferrer">Facebook pagina</a>.</li>
					<li>Ook in de Beemster kun je als groep wandelen en tegelijkertijd zwerfvuil opruimen. Voor meer informatie kun je mailen naar <a href="mailto: beemsterwandelingen@gmail.com" rel="noopener noreferrer">beemsterwandelingen@gmail.com</a>.</li>
					<li>Bij <a href="http://www.elkombi.nl/" target="_blank" rel="noopener noreferrer">El Kombi</a>, een initiatief van Nanda van den Ham uit Alkmaar, kun je als groep gezellig Suppen (staand op een surfboard) terwijl je de troep opruimt uit het water.</li>
					<li>De <a href="http://www.zwerfinator.nl/" target="_blank" rel="noopener noreferrer">Zwerfinator</a> (Dirk Groot uit Purmerend) bestrijdt zwerfafval en plastic soep door zelf te rapen en lol te maken, maar ook door gastlessen, workshops, teambuilding en als spreker.</li>
					<li>Ook <a href="http://www.nhnieuws.nl/nieuws/211741/Thea-uit-Zuidermeer-ruimt-in-haar-vrije-tijd-zwerfvuil-op" target="_blank" rel="noopener noreferrer">Thea de Weerd</a> uit Zuidermeer raapt regelmatig zwerfvuil op in haar omgeving.</li>
					<li>Rinze de Vries is actief bij het ontwikkelen van <a href="https://www.veiligschoonvoldoende.nl/veilig-schoon-voldoende/hoe-voorkomen-we-dat-kleiner-plastic-in-zee-komt_42512/" target="_blank" rel="noopener noreferrer">technieken</a> om zwerfvuil uit onze waterwegen te halen voordat het via onze gemalen de zee in gaat.</li>
					<li><a href="https://www.supportervanschoon.nl/" target="_blank" rel="noopener noreferrer">Supporter van Schoon</a> is het platform voor de nationale opschoondag.</li>
				</ul>
			</div>
		)
	}
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(About)