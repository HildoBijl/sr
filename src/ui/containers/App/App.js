import '../../shared/reset.css'
import '../../shared/general.css'
import './App.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import firebase from '../../../config/firebase.js'
import userActions from '../../../redux/user.js'
import statusActions from '../../../redux/status.js'

import Header from '../Header/Header.js'
import Page from '../Page/Page.js'

class App extends Component {
  componentWillMount() {
    // [LogIn] When the app starts to initialize, call Firebase to start setting up authentication.
    firebase.auth().getRedirectResult().then(this.props.processRedirectSuccess).catch(this.props.processRedirectError)
    firebase.auth().onAuthStateChanged(this.props.processAuthStateChange)
  }
  componentDidMount() {
    // [Online/Offline] When starting the app, after the window is available, start listening for events about going online/offline.
    if (!this.updateOnlineStatus)
      this.updateOnlineStatus = () => this.props.setOnlineStatus(navigator.onLine)
    this.updateOnlineStatus()
    window.addEventListener('online',  this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
  }
  componentWillUnmount() {
    // [Online/Offline] Stop listening for events about going online/offline.
    window.removeEventListener('online', this.updateOnlineStatus)
    window.removeEventListener('offline', this.updateOnlineStatus)
  }

  render() {
    return (
      <div className={classnames('app', this.props.theme)}>
        <Header />
        <Page />
      </div>
    )
  }
}

const stateMap = (state) => ({})
const actionMap = (dispatch) => ({
  processAuthStateChange: () => dispatch(userActions.processAuthStateChange()),
  processRedirectSuccess: (result) => dispatch(userActions.processRedirectSuccess(result)),
  processRedirectError: (error) => dispatch(userActions.processRedirectError(error)),
  setOnlineStatus: (online) => dispatch(statusActions.setOnlineStatus(online)),
})
export default connect(stateMap, actionMap)(App)