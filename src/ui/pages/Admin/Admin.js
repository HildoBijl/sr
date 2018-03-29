import './Admin.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import UserControl from './UserControl/UserControl.js'

const adminPages = [
	{
		key: 'ADMIN',
		title: 'Gebruikersbeheer',
		component: <UserControl />,
	},
	{
		key: 'NEWNEWS',
		title: 'Nieuw nieuwsbericht',
		component: <div><p>Dit nieuws gedeelte gaat nog gemaakt worden.</p></div>,
	},
	{
		key: 'NEWEXPERIENCE',
		title: 'Nieuwe ervaring',
		component: <div><p>Dit ervaringen gedeelte gaat nog gemaakt worden.</p></div>,
	},
]

class Admin extends Component {
	render() {
		const pageKey = this.props.location.type
		return (
			<div className="admin">
				<div className="adminButtons">
					{adminPages.map(page => (
						<div key={page.key} className={classnames('btn', { active: pageKey === page.key })} onClick={() => this.props.goToPage(page.key)}>{page.title}</div>
					))}
				</div>
				{this.renderSubPage()}
			</div>
		)
	}
	renderSubPage() {
		const page = adminPages.find((page) => page.key === this.props.location.type)
		if (page)
			return page.component
		return <div><p>Er is iets mis gegaan bij het laden van de pagina. Gebruik de knoppen hierboven om een actie te selecteren.</p></div>
	}
}

const stateMap = (state) => ({
	location: state.location,
})
const actionMap = (dispatch) => ({
	goToPage: (page, payload) => dispatch({ type: page, payload }),
})
export default connect(stateMap, actionMap)(Admin)