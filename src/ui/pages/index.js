import Home from './Home/Home.js'
import Settings from './Settings/Settings.js'
import About from './About/About.js'
import NotFound from './NotFound/NotFound.js'

const pages = {
	HOME: {
		component: Home,
		title: 'Stille Rapers',
		skipPrefix: true, // Do not use a prefix in the <title>.
		path: '/',
	},
	SETTINGS: {
		component: Settings,
		title: 'Instellingen',
		path: '/instellingen',
	},
	ABOUT: {
		component: About,
		title: 'Info',
		path: '/info',
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