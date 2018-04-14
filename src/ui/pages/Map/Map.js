import './Map.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import loadGoogleMapsAPI from 'load-google-maps-api'
import Link from 'redux-first-router-link'
import classnames from 'classnames'

import mapConfig from '../../../config/maps.json'
import { getMailLink, getDistance } from '../../../util.js'
import { isSignedIn } from '../../../redux/user.js'
import userDataActions from '../../../redux/userData.js'
import mapActions from '../../../redux/map.js'

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
	strokeWeight: 0,
}

class Map extends Component {
	constructor() {
		super()
		this.state = {
			location: undefined, // What is the location of the user? undefined means unknown.
			error: false, // Has an error occurred? If so, don't show a map.
		}

		// This object will keep track of all the polygons displayed on the map.
		this.userPolygons = {}

		// Bind event handlers to this class.
		this.processMapMouseMove = this.processMapMouseMove.bind(this)
		this.processMapMouseOut = this.processMapMouseOut.bind(this)
		this.processMapClick = this.processMapClick.bind(this)
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
				console.error(err) // TODO REMOVE
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

	// Save the position that we received from the navigator geolocation. By doing this, the map will automatically center on this point.
	setLocation(position) {
		this.setState({
			location: {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			},
		})
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
		this.props.setMouseLocation({ lat: evt.latLng.lat(), lng: evt.latLng.lng() })
	}
	processMapMouseOut(evt) {
		this.props.setMouseLocation(undefined)
	}
	processMapClick(evt) {
		// Don't do anything when we're not involved in an action.
		if (this.props.map.action === 'none')
			return

		// Check if we are close to the last point of the polygon. If so, remove the last point of the polygon.
		const location = { lat: evt.latLng.lat(), lng: evt.latLng.lng() }
		this.props.setMouseLocation(location)
		if (this.areLocationsClose(location, this.props.map.currentPolygon[this.props.map.currentPolygon.length - 1])) {
			return this.props.removePolygonLocation(this.props.map.currentPolygon.length - 1)
		}

		// Check if we are close to the first point of the polygon. If so, close (confirm) the polygon.
		if (this.areLocationsClose(location, this.props.map.currentPolygon[0])) {
			return this.props.confirmPolygon()
		}

		// Add the current location to the currently active polygon.
		this.props.addPolygonLocation(location)
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

		// If we just obtained the user's location, adjust the map location and zoom level.
		if (!oldProps || (!oldProps.location && this.props.location)) {
			this.map.setCenter(this.getUserLocation())
			this.map.setZoom(this.getDesiredZoom())
		}

		// Determine if we should update all polygons.
		let update = 'none'
		if (!oldProps)
			update = 'all'
		else if (!oldProps.userData.known && this.props.userData.known)
			update = 'all' // Update if we just obtained user data.
		else if (oldProps.map.page !== this.props.map.page)
			update = 'all' // Update if we switched page.
		else if (oldProps.map.action !== this.props.map.action)
			update = 'own'

		// Update the respective polygons.
		if (update === 'all')
			this.updateAllPolygons()
		else if (update === 'own')
			this.updateUserPolygons(this.props.user.uid)

		// Update the polygon, if needed.
		if (this.props.map.action === 'adding') {
			const polygon = this.props.map.currentPolygon.slice(0)
			if (this.props.map.mouse && !this.isMouseCloseTo(polygon[0]) && !this.isMouseCloseTo(polygon[polygon.length - 1]))
				polygon.push(this.props.map.mouse)
			this.polygon.setPaths(polygon)
			this.setMarkersToLocations(polygon)
		}
	}

	updateAllPolygons() {
		// Don't do anything without user data known.
		if (!this.props.userData.known)
			return

		// Walk through the users and update their polygons.
		Object.keys(this.props.userData.users).forEach(uid => this.updateUserPolygons(uid))
	}

	updateUserPolygons(uid) {
		// Walk through the user areas and update them.
		const user = this.props.userData.users[uid]
		if (user.areas)
			Object.keys(user.areas).forEach(aid => this.updatePolygon(user.areas[aid], aid, uid))
	}

	updatePolygon(area, aid, uid) {
		// If the user does not have an array for his polygons yet, create one.
		if (!this.userPolygons[uid])
			this.userPolygons[uid] = {}

		// If this area does not have its own polygon yet, create it.
		let polygon = this.userPolygons[uid][aid]
		if (!polygon) {
			polygon = new window.google.maps.Polygon({
				...polygonStyle,
				paths: area,
				map: this.map,
			})
			this.userPolygons[uid][aid] = polygon // Remember the polygon.
			this.addMapEventListeners(polygon) // The polygon should also process mouse events.
		}

		// Make sure that the polygon has the right properties.
		polygon.setVisible(this.props.map.page === 'fullMap' || uid === this.props.user.uid)
		polygon.setOptions({
			fillOpacity: this.props.map.action === 'none' ? 0.7 : 0.3,
		})
	}

	isMouseCloseTo(location) {
		return this.areLocationsClose(location, this.props.map.mouse)
	}
	areLocationsClose(a, b) {
		// Verify that we have two locations to compare.
		if (!a || !b)
			return false
		
		// Check the normalized distance, taking into account the map zoom.
		const distance = getDistance(a, b)
		const scale = 1183315101 / Math.pow(2, this.map.getZoom())
		const normalizedDistance = distance / scale
		return normalizedDistance < 0.001
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
		if (this.props.map.page === 'fullMap') { // Signed in and not editing; on the overview.
			return (
				<div className="map">
					{this.renderControlButtons()}
					{this.renderIntroduction()}
					<div key="googleMap" id="googleMap" ref={map => this.mapObj = map} />
				</div>
			)
		}
		return ( // Signed in and editing. This is the case when `this.props.map.page === 'ownAreas'.
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
				<div className={classnames('btn', { active: this.props.map.page === 'fullMap' })} onClick={() => this.props.setMapPage('fullMap')}>De kaart voor iedereen</div>
				<div className={classnames('btn', { active: this.props.map.page === 'ownAreas' })} onClick={() => this.props.setMapPage('ownAreas')}>Mijn gebieden wijzigen</div>
			</div>
		)
	}
	renderIntroduction() {
		return <p>Op de onderstaande kaart kun je zien waar er geraapt wordt. Klik op een gekleurd vlak om te zien wie in dat gebied actief is.</p>
	}
	renderEditingButtons() {
		if (this.props.map.action === 'none') {
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={() => this.props.setMapAction('adding')}>Voeg een nieuw gebied toe</div>
				</div>
			)
		}
		if (this.props.map.action === 'adding') {
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={this.props.confirmPolygon}>Bevestig gebied</div>
					<div className="btn" onClick={this.props.cancelPolygon}>Annuleer gebied</div>
				</div>
			)
		}
		if (this.props.map.action === 'editing') {
			// TODO: Add functions to process the edited area.
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={() => this.props.setMapAction('none')}>Bevestig wijzigingen</div>
					<div className="btn" onClick={() => this.props.setMapAction('none')}>Annuleer wijzigingen</div>
					<div className="btn" onClick={() => this.props.setMapAction('none')}>Verwijder gebied</div>
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
	map: state.map,
})
const actionMap = (dispatch) => ({
	goToPage: (page, payload) => dispatch({ type: page, payload }),
	loadUserData: () => dispatch(userDataActions.loadData()),
	setMapPage: (page) => dispatch(mapActions.setPage(page)),
	setMapAction: (action) => dispatch(mapActions.setAction(action)),
	setMouseLocation: (location) => dispatch(mapActions.setMouseLocation(location)),
	addPolygonLocation: (location) => dispatch(mapActions.addPolygonLocation(location)),
	removePolygonLocation: (locationIndex) => dispatch(mapActions.removePolygonLocation(locationIndex)),
	confirmPolygon: () => dispatch(mapActions.confirmPolygon()),
	cancelPolygon: () => dispatch(mapActions.cancelPolygon()),
})
export default connect(stateMap, actionMap)(Map)