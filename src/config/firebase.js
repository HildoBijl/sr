import firebase from 'firebase'
const config = {
	apiKey: "AIzaSyBtMMhmyg_zdcZgcBBGrhaBpT-XA6ObQbU",
	authDomain: "stille-rapers.firebaseapp.com",
	databaseURL: "https://stille-rapers.firebaseio.com",
	projectId: "stille-rapers",
	storageBucket: "stille-rapers.appspot.com",
	messagingSenderId: "960234185172",
}
firebase.initializeApp(config)
firebase.auth().languageCode = 'nl'
export default firebase