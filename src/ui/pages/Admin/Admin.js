import './Admin.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'

import firebase from '../../../config/firebase.js'

// TODO NEXT: SET UP DATABASE STRUCTURE USING BOLT.
// Firebase has an admin interface, but it can only run server-side. So client-side you cannot really manage users. The only exception is if you make your own database around it, storing everything in your own tables. So that's the plan. 
// Design a database set-up.
// On creating account, create relevant object.
// On log-in, update the relevant user data in a table.
// List this data in the admin overview.
// Optionally, the alternative is to set up cloud functions. Then through cloud functions we can make a call to list all users, and the cloud function then processes it. This may actually also be necessary to post pictures for the news overview. So it could be worthwhile to figure this out too first. 

class Admin extends Component {
	render() {
		return (
			<div className="admin">
				<p>Hier gaat de admin-pagina komen.</p>
			</div>
		)
	}
}

const stateMap = (state) => ({
	settings: state.settings,
})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(Admin)