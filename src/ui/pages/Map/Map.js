import './Map.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import loadGoogleMapsAPI from 'load-google-maps-api'
import Link from 'redux-first-router-link'
import classnames from 'classnames'

import firebase from '../../../config/firebase.js'
import mapConfig from '../../../config/maps.json'
import { getMailLink, rad2deg } from '../../../util.js'
import { isSignedIn } from '../../../redux/user.js'
import userDataActions from '../../../redux/userData.js'

const defaultLocation = { // This location is chosen to be right in the middle of our area. So if we focus the map on that and choose an appropriate scale, we should have the full area on-screen.
	lat: 52.7437793,
	lng: 4.8326161,
}
const zoomWithoutPosition = 8 // The zoom we apply when we don't know where the user is and use the default.
const zoomOnPosition = 12 // The zoom we apply when we know where the user is.

const polygonStyle = {
	fillColor: '#0000cc',
	fillOpacity: .5,
	scale: 5,
	strokeColor: '#000088',
	strokeWeight: 2,
}

class Map extends Component {
	constructor() {
		super()
		this.state = {
			location: undefined, // What is the location of the user? undefined means unknown.
			mouse: undefined, // What is the location of the mouse? undefined means the mouse is not on the map.
			error: false, // Has an error occurred? If so, don't show a map.

			// TODO: SET OWNAREAS TO FALSE.
			ownAreas: true, // Are we editing areas? (That is, on the editing page for one's own areas.)
			action: 'none', // What are we doing? Are we doing nothing ("none"), are we "adding" or are we "editing"?
			currentPolygon: [], // The currently active polygon, what coordinates does it consist of?
		}

		// Bind event handlers to this class.
		this.processMapMouseMove = this.processMapMouseMove.bind(this)
		this.processMapMouseOut = this.processMapMouseOut.bind(this)
		this.processMapClick = this.processMapClick.bind(this)
	}

	setLocation(position) {
		// Save the position that we received from the navigator geolocation. The update will automatically apply the new position.
		this.setState({
			location: {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			},
		})
	}

	componentDidMount() {
		// Start loading the user data.
		this.props.loadUserData()

		// On loading, ask for the location. If it's given, we center the map on that point and zoom in.
		if (navigator.geolocation) {
			const options = {
				enableHighAccuracy: false, // Do we need a very accurate estimate? (Accuracy within a few meters, instead of a hundred meters.)
				timeout: 5 * 1000, // After how much time (milliseconds) should we give up and call the fail method?
				maximumAge: 60 * 60 * 1000, // If an earlier position is known, should we return it? If yes, how old (milliseconds) can that position maximally be?
			}
			navigator.geolocation.getCurrentPosition(this.setLocation.bind(this), undefined, options)
		}

		// Load Google Maps API if not loaded already.
		if (!window.google || !window.google.maps) {
			loadGoogleMapsAPI({
				key: mapConfig.browserKey,
			}).then(() => {
				this.updateMap()
			}).catch((err) => {
				this.setState({
					error: true,
				})
			})
		} else {
			this.updateMap()
		}
	}

	componentDidUpdate(oldProps) {
		this.updateMap(oldProps)
	}

	initializeMap() {
		const GM = window.google.maps

		// Set up the map.
		const options = {
			zoom: this.getDesiredZoom(),
			center: this.getUserLocation(),
			clickableIcons: false, // This is to prevent clickable icons on the map. They disrupt our own events, which is annoying.
		}
		this.map = new GM.Map(this.mapObj, options)
		this.addMapEventListeners(this.map) // Listen to all required events.

		// TODO: REMOVE MARKER?
		// Set up a marker that is used for following the mouse when required. At the start, make it invisible.
		this.marker = new GM.Marker({
			position: this.getUserLocation(),
			icon: {
				path: GM.SymbolPath.CIRCLE,
				fillColor: '#0000cc',
				fillOpacity: .5,
				scale: 5,
				strokeColor: '#000088',
				strokeWeight: 2,
			},
			map: this.map,
			visible: false,
		})
		this.addMapEventListeners(this.marker) // This object should also process mouse events.

		// Set up a polygon to display for active events.
		this.polygon = new GM.Polygon({
			...polygonStyle,
			paths: [],
			map: this.map,
			visible: false,
		})
		this.addMapEventListeners(this.polygon) // This object should also process mouse events.

		// Set up an array of markers. We will fill it up as we go.
		this.markers = []
	}

	addMapEventListeners(obj) {
		obj.addListener('mousemove', this.processMapMouseMove)
		obj.addListener('mouseout', this.processMapMouseOut)
		obj.addListener('click', this.processMapClick)
	}

	processMapMouseMove(evt) {
		this.setState({ mouse: { lat: evt.latLng.lat(), lng: evt.latLng.lng() } })
	}
	processMapMouseOut(evt) {
		this.setState({ mouse: undefined })
	}
	processMapClick(evt) {
		// Don't do anything when we're not involved in an action.
		if (this.state.action === 'none')
			return

		// Check if we are close to the last point of the polygon. If so, remove the last point of the polygon.
		const location = { lat: evt.latLng.lat(), lng: evt.latLng.lng() }
		if (this.areLocationsClose(location, this.state.currentPolygon[this.state.currentPolygon.length - 1])) {
			return this.setState({ currentPolygon: this.state.currentPolygon.slice(0, -1) })
		}

		// Check if we are close to the first point of the polygon. If so, close (confirm) the polygon.
		if (this.areLocationsClose(location, this.state.currentPolygon[0])) {
			return this.confirmCurrentPolygon()
		}

		// Add the current location to the currently active polygon.
		this.addLocationToCurrentPolygon(location)
	}

	addLocationToCurrentPolygon(location) {
		const currentPolygon = this.state.currentPolygon.slice(0)
		currentPolygon.push(location)
		this.setState({ currentPolygon })
		console.log(JSON.stringify(currentPolygon))
	}

	setMarkersToLocations(locations) {
		// Add markers if necessary.
		const GM = window.google.maps
		while (this.markers.length < locations.length) {
			const newMarker = new GM.Marker({
				position: this.getUserLocation(),
				icon: {
					path: GM.SymbolPath.CIRCLE,
					fillColor: '#0000cc',
					fillOpacity: .5,
					scale: 5,
					strokeColor: '#000088',
					strokeWeight: 2,
				},
				map: this.map,
			})
			this.addMapEventListeners(newMarker)
			this.markers.push(newMarker)
		}

		// Hide all markers.
		this.markers.forEach(marker => marker.setVisible(false))

		// Walk through the markers to update their locations.
		locations.forEach((location, i) => {
			this.markers[i].setPosition(location)
			this.markers[i].setVisible(true)
		})
	}

	updateMap(oldProps) {
		// If we don't have the Google Maps API loaded yet, do nothing.
		if (!window.google || !window.google.maps)
			return

		// If we haven't initialized the map yet, do so right away.
		if (!this.map)
			this.initializeMap()

		// Adjust the position if we just obtained it.
		if (!oldProps || (!oldProps.location && this.props.location)) {
			this.map.setCenter(this.getUserLocation())
			this.map.setZoom(this.getDesiredZoom())
		}

		// Update the polygons if we just obtained the user data.
		if ((!oldProps || !oldProps.userData.known) && this.props.userData.known) {
			// Walk through the users and then through the polygons.
			this.userPolygons = {}
			Object.keys(this.props.userData.users).forEach(uid => {
				// Walk through the user areas and display them.
				const user = this.props.userData.users[uid]
				if (user.areas)
					Object.keys(user.areas).forEach(aid => this.displayArea(user.areas[aid], aid, uid))
			})
		}

		// Update the polygon, if needed.
		if (this.state.action === 'adding') {
			const polygon = this.state.currentPolygon.slice(0)
			if (this.state.mouse && !this.isMouseCloseTo(polygon[0]) && !this.isMouseCloseTo(polygon[polygon.length - 1]))
				polygon.push(this.state.mouse)
			this.polygon.setPaths(polygon)
			this.setMarkersToLocations(polygon)
		}
	}

	displayArea(area, aid, uid) {
		// If the user does not have an array for his polygons yet, create one.
		if (!this.userPolygons[uid])
			this.userPolygons[uid] = {}

		// Set up a polygon for the given area.
		const polygon = new window.google.maps.Polygon({
			...polygonStyle,
			paths: area,
			map: this.map,
		})
		this.addMapEventListeners(this.polygon) // This object should also process mouse events.
		
		// Remember the given polygon.
		this.userPolygons[uid][aid] = polygon
	}

	isMouseCloseTo(location) {
		return this.areLocationsClose(location, this.state.mouse)
	}

	areLocationsClose(a, b) {
		// Verify that we have two locations to compare.
		if (!a || !b)
			return false
		
		// Check the normalized distance, taking into account the map zoom.
		const distance = this.getDistance(a, b)
		const scale = 1183315101 / Math.pow(2, this.map.getZoom())
		const normalizedDistance = distance / scale
		return normalizedDistance < 0.001
	}

	getDistance(a, b) {
		// Apply the Haversine formula to get the distance between two points, with latitude and longitude known.
		const dLat = rad2deg(b.lat - a.lat)
		const dLng = rad2deg(b.lng - a.lng)
		const c = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad2deg(a.lat)) * Math.cos(rad2deg(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
		return 6378137 * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c)) // Multiply by Earth's radius too.
	}
	confirmCurrentPolygon() {
		// Verify that the polygon is valid.
		console.log('Confirming!')
		const polygon = this.state.currentPolygon
		if (this.isValidPolygon(polygon)) {
			firebase.database().ref(`public/users/${this.props.user.uid}/areas`).push(polygon)
			// TODO: ADD TO LOCAL STORAGE.
		}
		this.cancelCurrentPolygon()
		// Store polygon, also to internal data.
	}
	cancelCurrentPolygon() {
		console.log('Getting rid of polygon.')
		this.setState({
			action: 'none',
			currentPolygon: [],
		})
	}

	isValidPolygon(polygon) {
		if (polygon.length <= 2)
			return false
		return true
	}

	render() {
		// Check if there has been an error somewhere.
		if (this.state.error)
			return this.renderErrorMessage()

		// Set up the page. This differs per case.
		if (!isSignedIn(this.props.user)) { // Not signed in. This shows the overview page.
			return (
				<div className="map">
					{this.renderIntroduction()}
					<p>Raap jij ook regelmatig zwerfvuil op? Als je <Link to={{ type: 'ACCOUNT' }}>inlogt</Link> kun je jezelf ook toevoegen op de kaart.</p>
					<div key="googleMap" id="googleMap" ref={map => this.mapObj = map} />
				</div>
			)
		}
		if (!this.state.ownAreas) { // Signed in and not editing; on the overview.
			return (
				<div className="map">
					{this.renderControlButtons()}
					{this.renderIntroduction()}
					<div key="googleMap" id="googleMap" ref={map => this.mapObj = map} />
				</div>
			)
		}
		return ( // Signed in and editing.
			<div className="map">
				{this.renderControlButtons()}
				<p>Je kunt hier zelf aangeven waar jij regelmatig (minimaal enkele keren per jaar) zwerfvuil aan het rapen bent.</p>
				{this.renderEditingButtons()}
				<div key="googleMap" id="googleMap" ref={map => this.mapObj = map} />
				<div className="sizeWarning">
					<p>Als je de gebieden waar jij in raapt aan wilt passen, dan kun je het beste achter een computer met een redelijk groot scherm zitten. Anders wordt het een hoop priegelwerk. Dus zoek een groot scherm op, en dan vertel ik je verder hoe het werkt.</p>
				</div>
				<div className="explanation">
					<p>Gebieden toevoegen en/of aanpassen is niet heel moeilijk. Wil je een ... </p>
					<ul>
						<li>gebied toevoegen? Gebruik de "Nieuw gebied" knop boven de kaart. Plaats vervolgens de hoekpunten van het gebied door op de kaart te klikken. Klik op "Klaar met gebied", of op het allereerst toevoegde hoekpunt, om het gebied te bevestigen.</li>
						<li>gebied verwijderen? Klik op het betreffende gebied en vervolgens op de knop "Verwijder gebied" boven de kaart.</li>
						<li>gebied wijzigen? Klik op het betreffende gebied. Je kunt nu ...
								<ul>
								<li>hoekpunten verplaatsen door de betreffende hoekpunten te verslepen.</li>
								<li>hoekpunten toevoegen door de rand van een gebied te verslepen.</li>
								<li>hoekpunten verwijderen door een hoekpunt op een ander bestaand hoekpunt te slepen.</li>
							</ul>
						</li>
					</ul>
					<p>Als je niet meer actief bent als raper, dan kun je ook <span className="btn inline">al je gebieden verwijderen</span></p>
				</div>
			</div>
		)
		// TODO: IMPLEMENT DELETE ALL BUTTON ABOVE.
	}
	renderControlButtons() {
		return (
			<div className="buttonHolder">
				<div className={classnames('btn', { active: !this.state.ownAreas })} onClick={() => this.setState({ ownAreas: false })}>De kaart voor iedereen</div>
				<div className={classnames('btn', { active: this.state.ownAreas })} onClick={() => this.setState({ ownAreas: true })}>Mijn gebieden wijzigen</div>
			</div>
		)
	}
	renderIntroduction() {
		return <p>Op de onderstaande kaart kun je zien waar er geraapt wordt. Klik op een gekleurd vlak om te zien wie in dat gebied actief is.</p>
	}
	renderEditingButtons() {
		if (this.state.action === 'none') {
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={() => this.setState({ action: 'adding' })}>Voeg een nieuw gebied toe</div>
				</div>
			)
		}
		if (this.state.action === 'adding') {
			// TODO: Add functions to process the added area.
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={this.confirmCurrentPolygon.bind(this)}>Bevestig gebied</div>
					<div className="btn" onClick={this.cancelCurrentPolygon.bind(this)}>Annuleer gebied</div>
				</div>
			)
		}
		if (this.state.action === 'editing') {
			// TODO: Add functions to process the edited area.
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={() => this.setState({ action: 'none' })}>Bevestig wijzigingen</div>
					<div className="btn" onClick={() => this.setState({ action: 'none' })}>Annuleer wijzigingen</div>
					<div className="btn" onClick={() => this.setState({ action: 'none' })}>Verwijder gebied</div>
				</div>
			)
		}
		throw new Error('Unexpected case: there was an unexpected action given to the map controller.')
	}
	renderErrorMessage() {
		return (
			<div className="map">
				<p>Oops ... er is iets mis gegaan bij het laden van de kaart. Probeer de pagina te verversen. Mocht dit niet helpen, en mocht je zeker weten dat je internetverbinding goed werkt, stuur ons dan even een mailtje via {getMailLink()}.</p>
			</div>
		)
	}

	getUserLocation() {
		return this.state.location || defaultLocation
	}
	getDesiredZoom() {
		return this.state.location ? zoomOnPosition : zoomWithoutPosition
	}
}

const stateMap = (state) => ({
	location: state.location,
	user: state.user,
	userData: state.userData,
})
const actionMap = (dispatch) => ({
	goToPage: (page, payload) => dispatch({ type: page, payload }),
	loadUserData: () => dispatch(userDataActions.loadData()),
})
export default connect(stateMap, actionMap)(Map)