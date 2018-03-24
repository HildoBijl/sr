import './Page.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import pages from '../../pages'
import { isRoleKnown } from '../../../redux/user.js'

class Page extends Component {
	componentWillReceiveProps(newProps) {
		// Verify if the user is allowed on the page we're supposed to show.
		const user = newProps.user
		const page = pages[newProps.locationType] || pages.NOTFOUND
		if (page.restriction && !page.restriction(user)) {
			// The user is not allowed! But maybe this is because his role is not known yet? If so, we still wait. Otherwise, we go somewhere safe.
			if (isRoleKnown(user)) {
				newProps.goToHomepage() // Firebase is ready. So the problem is the user. He's not allowed. Let's go somewhere safe.
			}
		}
	}
	render() {
		// Determine the page, and check whether the user is allowed to see it.
		const page = pages[this.props.locationType] || pages.NOTFOUND
		if (page.restriction && !page.restriction(this.props.user)) {
			return ''
		}

		return (
			<main className="page">
				<ReactCSSTransitionGroup
					component="div"
					className="pageFader"
					transitionName="pageFade"
					transitionAppear={true}
					transitionAppearTimeout={200}
					transitionEnterTimeout={200}
					transitionLeaveTimeout={200}
				>
					<page.component key={page.name} />
				</ReactCSSTransitionGroup>
			</main>
		)
	}
}

const stateMap = (state) => ({
	locationType: state.location.type,
	payload: state.location.payload,
	user: state.user,
})
const actionMap = (dispatch) => ({
	goToHomepage: () => dispatch({ type: 'HOME' }),
})
export default connect(stateMap, actionMap)(Page)