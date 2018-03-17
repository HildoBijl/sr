import './Header.css'

import React from 'react'
import Link from 'redux-first-router-link'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'

import pages, { getTitle } from '../../pages'
import MenuItem from '../../components/MenuItem/MenuItem.js'
import Logo from '../../icons/Logo.js'
import User from '../../icons/User.js'
import Cog from '../../icons/Cog.js'
import Key from '../../icons/Key.js'
import Map from '../../icons/Map.js'
import News from '../../icons/News.js'
import Info from '../../icons/Info.js'

import { isSignedIn } from '../../../redux/user.js'

const Header = (props) => {
	const page = pages[props.locationType] || pages.NOTFOUND
	return (
		<header className="header">
			<div className="contents">
				<div className="title">
					<Link to={{ type: 'HOME' }} className="logoLink">
						<Logo className="logo"/>
					</Link>
					<h1>{getTitle(page, props.payload, props.user)}</h1>
					<Helmet>
						<title>{page.skipPrefix ? '' : 'Stille Rapers - '}{getTitle(page, props.payload, props.user)}</title>
					</Helmet>
				</div>
				<nav className="menu">
					<MenuItem link="STORIES" icon={News} label="Ervaringen" />
					<MenuItem link="ABOUT" icon={Info} label="Info" />
					<MenuItem link="MAP" icon={Map} label="Kaart" />
					{isSignedIn(props.user) ? <MenuItem link="ACCOUNT" icon={Cog} label="Instellingen" /> : <MenuItem link="ACCOUNT" icon={User} label="Log in" />}
					{false /* TODO: check if admin */ ? <MenuItem link="ADMIN" icon={Key} label="Beheer" /> : ''}
				</nav>
			</div>
		</header>
	)
}

const stateMap = (state) => ({
	locationType: state.location.type,
	payload: state.location.payload,
	user: state.user,
})
export default connect(stateMap)(Header)