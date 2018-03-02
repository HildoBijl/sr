import './Settings.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

// import Checkbox from '../../components/Checkbox/Checkbox.js' // TODO

// import settingsActions from '../../../redux/settings.js' // TODO

class Settings extends Component {
	render() {
		// const settings = this.props.settings // TODO
		return (
			<div className="settings">
				<p>Hier gaat de instellingen-pagina komen.</p>
			</div>
		)
	}
}

const stateMap = (state) => ({
	settings: state.settings,
})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Settings)