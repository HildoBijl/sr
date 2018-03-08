import Home from './Home/Home.js'
import Stories from './Stories/Stories.js'
import Map from './Map/Map.js'
import About from './About/About.js'
import LogIn from './LogIn/LogIn.js'
import Settings from './Settings/Settings.js'
import Admin from './Admin/Admin.js'
import NotFound from './NotFound/NotFound.js'

const pages = {
	HOME: {
		component: Home,
		title: 'Stille Rapers',
		skipPrefix: true, // Do not use a prefix in the <title>.
		path: '/(index.html)?', // Make both the base path '/' and '/index.html' point to the Home page. The latter is called when a PWA starts up on a smartphone as local app.
	},
	STORIES: {
		component: Stories,
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
	LOGIN: {
		component: LogIn,
		title: 'Log in',
		path: '/login',
	},
	SETTINGS: {
		component: Settings,
		title: 'Instellingen',
		path: '/instellingen',
	},
	ADMIN: {
		component: Admin,
		title: 'Beheer',
		path: '/beheer',
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

export function getTitle(page, payload) {
	if (typeof(page.title) === 'function')
		return page.title(payload)
	return page.title
}

// Set up a routes object that can be used by redux-first-router.
const routes = {}
for (let name in pages) {
	if (pages[name].path)
		routes[name] = pages[name].path
}
export { routes }