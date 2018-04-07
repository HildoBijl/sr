import Home from './Home/Home.js'
import Experiences from './Experiences/Experiences.js'
import Map from './Map/Map.js'
import About from './About/About.js'
import Account from './Account/Account.js'
import Admin from './Admin/Admin.js'
import NotFound from './NotFound/NotFound.js'

import { isSignedIn, isAdmin } from '../../redux/user.js'

const pages = {
	HOME: {
		component: Home,
		title: 'Stille Rapers',
		skipPrefix: true, // Do not use a prefix in the <title>.
		path: '/(index.html)?', // Make both the base path '/' and '/index.html' point to the Home page. The latter is called when a PWA starts up on a smartphone as local app.
	},
	EXPERIENCES: {
		component: Experiences,
		title: 'Ervaringen',
		path: '/ervaringen',
	},
	MAP: {
		component: Map,
		title: 'Kaart',
		path: '/kaart',
	},
	ABOUT: {
		component: About,
		title: 'Info',
		path: '/info',
	},
	ACCOUNT: {
		component: Account,
		title: (payload, user) => (isSignedIn(user) ? 'Instellingen' : 'Log in'),
		path: '/account',
	},
	ADMIN: {
		component: Admin,
		title: 'Gebruikersbeheer',
		path: '/beheer/gebruikers',
		restriction: (user) => isAdmin(user),
	},
	NEWNEWS: {
		component: Admin,
		title: 'Nieuw nieuwsbericht',
		path: '/beheer/nieuws',
		restriction: (user) => isAdmin(user),
	},
	EDITNEWS: {
		component: Admin,
		title: 'Wijzig nieuwsbericht',
		path: '/beheer/nieuws/wijzig',
		restriction: (user) => isAdmin(user),
	},
	NEWEXPERIENCE: {
		component: Admin,
		title: 'Nieuwe ervaring',
		path: '/beheer/ervaring',
		restriction: (user) => isAdmin(user),
	},
	EDITEXPERIENCE: {
		component: Admin,
		title: 'Wijzig ervaring',
		path: '/beheer/ervaring/wijzig',
		restriction: (user) => isAdmin(user),
	},
	NOTFOUND: {
		component: NotFound,
		title: 'Oops ...',
		path: '/notfound',
	},
}
for (let name in pages) {
	pages[name].name = name
}
export default pages

export function getTitle(page, payload, user) {
	if (typeof(page.title) === 'function')
		return page.title(payload, user)
	return page.title
}

// Set up a routes object that can be used by redux-first-router.
const routes = {}
for (let name in pages) {
	if (pages[name].path)
		routes[name] = pages[name].path
}
export { routes }