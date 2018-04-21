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
import { colorToHex, hexToColor, getRandomColor } from '../../../ui/colors.js'

const defaultLocation = { // This location is chosen to be right in the middle of our area. So if we focus the map on that and choose an appropriate scale, we should have the full area on-screen.
	lat: 52.7437793,
	lng: 4.8326161,
}
const zoomWithoutPosition = 9 // The zoom we apply when we don't know where the user is and use the default.
const zoomOnPosition = 13 // The zoom we apply when we know where the user is.

let GM // This will be the Google maps interface.

class Map extends Component {
	constructor() {
		super()
		this.state = {
			location: undefined, // What is the location of the user? undefined means unknown.
			error: false, // Has an error occurred? If so, don't show a map.
		}

		// Bind event handlers to this class.
		this.processMapMouseMove = this.processMapMouseMove.bind(this)
		this.processMapMouseOut = this.processMapMouseOut.bind(this)
		this.processMapClick = this.processMapClick.bind(this)
		this.processPolygonMouseMove = this.processPolygonMouseMove.bind(this)
		this.processPolygonMouseOut = this.processPolygonMouseOut.bind(this)
		this.processPolygonClick = this.processPolygonClick.bind(this)
		this.mapIconStyle = this.mapIconStyle.bind(this)
	}

	/*
	 * React Lifecycle functions.
	 */

	// componentDidMount will ensure that all necessary data starts loading.
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
			navigator.geolocation.getCurrentPosition((position) => {
				this.setState({
					location: {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					},
				})
			}, undefined, options)
		}

		// Load Google Maps API if not loaded already.
		if (!window.google || !window.google.maps) {
			loadGoogleMapsAPI({
				key: mapConfig.browserKey,
			}).then((result) => {
				GM = result
				this.updateMap()
			}).catch((err) => {
				this.setState({
					error: true,
				})
			})
		} else {
			GM = window.google.maps
			this.updateMap()
		}
	}
	// componentDidUpdate will ensure that the map applies any necessary updates.
	componentDidUpdate(oldProps, oldState) {
		this.updateMap(oldProps, oldState)
	}

	/*
	 * Event handler functions, used for processing events when they take place.
	 */

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
	processPolygonMouseMove(evt) {
		if (evt.feature.getProperty('type') !== 'polygon')
			return // Only do stuff for hovers over a polygon.
		if (!this.props.userData.known)
			return // Only do stuff when we have user data.

		// In general, highlight the polygon.
		this.props.setHoverArea(evt.feature.getId(), evt.feature.getProperty('uid'))

		// If we are on the overview page, show the right info screen.
		if (this.props.map.page === 'fullMap') {
			const uid = evt.feature.getProperty('uid')
			console.log('Show data for ' + this.props.userData.users[uid].name)
		}
	}
	processPolygonMouseOut(evt) {
		if (evt.feature.getProperty('type') !== 'polygon')
			return // Only do stuff for hovers over a polygon.
		if (!this.props.userData.known)
			return // Only do stuff when we have user data.

		// Revert the style to stop highlighting the polygon.
		this.props.clearHoverArea()
	}
	processPolygonClick(evt) {
		if (evt.feature.getProperty('type') !== 'polygon')
			return // Only do stuff for hovers over a polygon.
		if (!this.props.userData.known)
			return // Only do stuff when we have user data.

		if (this.props.map.page === 'ownAreas') {
			this.props.activateArea(evt.feature.getId())
		}
	}

	/*
	 * Initialization functions.
	 */

	// initializeMap sets up the map when the Google Maps API has loaded.
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
		this.addMapEventListeners(this.map.data) // Listen to all required events.
	}
	// initializePolygons sets up the polygonical areas when the data from all the users has loaded.
	initializePolygons() {
		// Walk through the users and initialize their polygons.
		this.userPolygons = {} // This object will store all individual polygons.
		Object.keys(this.props.userData.users).forEach(uid => this.initializeUserPolygons(uid))

		// Initialize the polygon used when adding new Polygons (or editing current ones).
		this.currentPolygon = this.map.data.add({
			id: 'current',
			properties: {
				uid: this.props.user.uid,
				type: 'polygon',
			},
			geometry: new GM.Data.Polygon([]),
		})

		// Set up listeners for interactive events.
		this.map.data.addListener('mousemove', this.processPolygonMouseMove)
		this.map.data.addListener('mouseout', this.processPolygonMouseOut)
		this.map.data.addListener('click', this.processPolygonClick)

		// Ensure that all polygons have the right style.
		this.updatePolygonStyle()
	}
	// initializeUserPolygons initializes the polygons for a single user.
	initializeUserPolygons(uid) {
		// Walk through the user areas and update them.
		const user = this.props.userData.users[uid]
		this.userPolygons[uid] = {} // Create an object for the user polygons.
		Object.keys(user.areas || {}).forEach(aid => this.initializePolygon(user.areas[aid], aid, uid))
	}
	// initializePolygon initializes a single polygon area on the map.
	initializePolygon(area, aid, uid) {
		this.userPolygons[uid][aid] = this.map.data.add({
			id: aid,
			properties: {
				uid,
				type: 'polygon',
			},
			geometry: new GM.Data.Polygon([area]),
		})
	}

	/*
	 * Update functions.
	 */

	// updateMap is the function that is called whenever anything changes. It needs to figure out what has changed, and adjust the map elements accordingly.
	updateMap(oldProps, oldState) {
		// If we don't have the Google Maps API loaded yet, do nothing.
		if (!GM)
			return

		// If we haven't initialized the map yet, do so right away.
		if (!this.map)
			this.initializeMap()

		// If we just obtained the user's location, adjust the map location and zoom level.
		if (!oldState || (!oldState.location && this.state.location)) {
			this.map.setCenter(this.getUserLocation())
			this.map.setZoom(this.getDesiredZoom())
		}

		// If we haven't initialized the polygons yet, but we do have data, initialize the polygons.
		if (!this.userPolygons && this.props.userData.known)
			this.initializePolygons()

		// Determine if there was a change in the userData.
		if (this.props.userData.lastChange) {
			const change = this.props.userData.lastChange
			switch (change.type) {
				case 'ApplyColor': {
					this.updatePolygonStyle()
					break;
				}
				case 'AddArea': {
					const area = this.props.userData.users[change.uid].areas[change.aid]
					this.initializePolygon(area, change.aid, change.uid)
					break;
				}
				default: {
					break;
				}
			}
		}

		// If the hover area or the active area changed, update styles too.
		if (oldProps && this.props.map.hover !== oldProps.map.hover)
			this.updatePolygonStyle()
		if (oldProps && this.props.map.activeArea !== oldProps.map.activeArea)
			this.updatePolygonStyle()


		// Determine if we should update the current polygon.
		if (!oldProps)
			this.updateCurrentPolygon()
		else if ((this.props.map.action === 'adding' || this.props.map.action !== oldProps.map.action) && (oldProps.map.currentPolygon !== this.props.map.currentPolygon || oldProps.map.mouse !== this.props.map.mouse))
			this.updateCurrentPolygon()

		// Determine if we should update the polygon style based on a page/action change.
		if (oldProps) {
			if (oldProps.map.page !== this.props.map.page)
				this.updatePolygonStyle() // Update if we switched page.
			else if (oldProps.map.action !== this.props.map.action) {
				this.updatePolygonStyle() // Update if we switched action.
				if (this.props.map.action === 'none')
					this.setMarkerLocations([])
			}
		}
	}
	// updatePolygonStyle will ensure that all the polygons have the right style (color, visibility, stroke, etcetera).
	updatePolygonStyle() {
		// Set the right style for all polygons.
		if (this.map)
			this.map.data.setStyle(this.mapIconStyle)
	}
	// updateCurrentPolygon will update the shape and style of the current polygon. It's usually called when the mouse moves, so that one corner of the polygon follows the the mouse.
	updateCurrentPolygon() {
		// Don't do anything if we haven't initialized the current polygon yet.
		if (!this.currentPolygon)
			return

		// Figure out which polygon to display, and display it.
		const polygon = this.props.map.currentPolygon.slice(0)
		if (this.props.map.mouse && !this.isMouseCloseTo(polygon[0]) && !this.isMouseCloseTo(polygon[polygon.length - 1]))
			polygon.push(this.props.map.mouse)
		this.setMarkerLocations(polygon) // Set the markers in the right location.
		this.currentPolygon.setGeometry(new GM.Data.Polygon([polygon])) // Apply the new locations to the current polygon.
		this.map.data.overrideStyle(this.currentPolygon, {}) // Update the style for the current polygon.
	}
	// setMarkerLocations will put all the markers in the locations specified in the given array.
	setMarkerLocations(locations) {
		// Ensure we have a marker array.
		if (!this.markers)
			this.markers = []

		// Fix every individual marker.
		locations.forEach((location, i) => {
			// Check if we already have a marker that we can recycle.
			if (this.markers[i]) {
				// If the location is different than what we had, adjust the marker. Otherwise we're already fine.
				if (this.markers[i].getProperty('lat') !== location.lat || this.markers[i].getProperty('lng') !== location.lng) {
					this.markers[i].setProperty('lat', location.lat)
					this.markers[i].setProperty('lng', location.lng)
					this.markers[i].setGeometry(new GM.Data.Point(location))
				}
			} else {
				// Make a new marker in the right location.
				this.markers[i] = this.map.data.add({
					id: 'marker' + i,
					properties: {
						...location,
						type: 'marker',
					},
					geometry: new GM.Data.Point(location),
				})
			}
		})

		// Remove unnecessary markers from our storage.
		while (this.markers.length > locations.length) {
			this.map.data.remove(this.markers.pop())
		}
	}
	// mapIconStyle is the styling function given to all map icons (markers/polygons). It is responsible for giving all icons the right style.
	mapIconStyle(feature) {
		// If this is a marker, return marker style.
		if (feature.getProperty('type') === 'marker') {
			return {
				icon: {
					path: GM.SymbolPath.CIRCLE,
					strokeWeight: 0,
					fillColor: this.props.user.color,
					fillOpacity: 1,
					scale: 8,
				},
				zIndex: Math.floor(Math.random() * 1000), // TODO: Calculate size of the area, and use a negative version of it for the z-index to ensure small areas to appear on top.
			}
		}

		// It's a polygon. Return polygon style. For this, first figure out several area properties.
		const geometry = feature.getGeometry()
		const aid = feature.getId()
		const uid = feature.getProperty('uid')
		const isHoveringOn = (this.props.map.hover && aid === this.props.map.hover.aid)
		const isActive = this.props.map.activeArea === aid
		const numSides = geometry.getLength() > 0 ? geometry.getAt(0).getLength() : 0
		const isCurrentUser = (uid === this.props.user.uid)

		// Then determine various style properties.
		const visible = this.props.map.page === 'fullMap' || (this.props.map.page === 'ownAreas' && isCurrentUser)
		const color = hexToColor(this.props.userData.users[uid].color) || getRandomColor()
		const useStroke = (aid === 'current' && numSides <= 2) // Add a stroke when the user is placing his second point, so he already gets some visual feedback.
		const clickable = (this.props.map.page === 'ownAreas' && (this.props.map.action !== 'adding' && this.props.map.action !== 'editing'))
		// ToDo later: when editing a polygon, don't show it, but replace it by the active polygon. For this polygon, add a border which the user can click on to add markers. When the user makes his first edit, change the action from 'selecting' to 'editing'.

		// Determine the opacity.
		let opacity = 0.5 // Default opacity.
		if (isActive)
			opacity = 1 // This area is active.
		else if (isHoveringOn && (clickable || this.props.map.page === 'fullMap'))
			opacity = 0.8 // This area is being hovered on. (But we are not adding/editing stuff. When adding/editing, hovering over stuff is not relevant/possible.)
		else if (this.props.map.activeArea)
			opacity = 0.3 // Some other area is active.
		else if (this.props.map.action !== 'none' && aid !== 'current')
			opacity = 0.3 // We are adding/editing another area, so this area is faded.

		return {
			cursor: clickable ? 'pointer' : 'grab',
			fillColor: colorToHex(color),
			fillOpacity: opacity,
			strokeColor: colorToHex(color),
			strokeWeight: useStroke ? 8 : 0,
			strokeOpacity: opacity,
			visible: visible,
		}
	}

	/*
	 * Render functions, determining what needs to be showed.
	 */

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
			// TODO: Make editing functionalities. Afterwards, also set up these buttons properly.
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={() => this.props.clearActiveArea()}>Bevestig wijzigingen</div>
					<div className="btn" onClick={() => this.props.clearActiveArea()}>Annuleer wijzigingen</div>
					<div className="btn" onClick={() => this.props.setMapAction('none')}>Verwijder gebied</div>
				</div>
			)
		}
		if (this.props.map.action === 'selecting') {
			// ToDo: After setting up editing functionalities, make buttons equal to editing case.
			// TODO next: Add functions to process the delete area.
			return (
				<div className="buttonHolder">
					<div className="btn" onClick={() => this.props.startAddingArea()}>Voeg een nieuw gebied toe</div>
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

	/*
	 * Support functions, for various basic but important tasks.
	 */

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
	startAddingArea: () => dispatch(mapActions.startAddingArea()),
	setMouseLocation: (location) => dispatch(mapActions.setMouseLocation(location)),
	addPolygonLocation: (location) => dispatch(mapActions.addPolygonLocation(location)),
	removePolygonLocation: (locationIndex) => dispatch(mapActions.removePolygonLocation(locationIndex)),
	confirmPolygon: () => dispatch(mapActions.confirmPolygon()),
	cancelPolygon: () => dispatch(mapActions.cancelPolygon()),
	setHoverArea: (aid, uid) => dispatch(mapActions.setHoverArea(aid, uid)),
	clearHoverArea: () => dispatch(mapActions.clearHoverArea()),
	activateArea: (aid) => dispatch(mapActions.activateArea(aid)),
	clearActiveArea: () => dispatch(mapActions.clearActiveArea()),
})
export default connect(stateMap, actionMap)(Map)