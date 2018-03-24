import './Account.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import Link from 'redux-first-router-link'

import Checkbox from '../../components/Checkbox/Checkbox.js'

import userActions, { isSignedIn, isFirebaseReady } from '../../../redux/user.js'
import settingsActions, { getSettings } from '../../../redux/settings.js'

const hideNotificationAfter = 6000 // The number of milliseconds after which we hide the notification.

class Account extends Component {

  // The following functions are about rendering stuff.
  getNotification() {
    // Check if a notification exists.
    const notification = this.props.user.notification
    if (!notification)
      return <p className="notification hidden"></p>

    // Check if it should still be shown. Hide it when necessary.
    const timeUntilHide = hideNotificationAfter - (new Date() - notification.date)
    if (timeUntilHide > 0) {
      if (this.notificationTimeout)
        clearTimeout(this.notificationTimeout)
      this.notificationTimeout = setTimeout(this.forceUpdate.bind(this), timeUntilHide)
    }

    // Give the notification HTML.
    return (
      <p className={classnames("notification", notification.type, { "hidden": timeUntilHide <= 0 })}>
        {notification.message}
      </p>
    )
  }
  componentWillUnmount() {
    // We do not force an update when the object already dismounted. It is pointless, and React would throw an error too.
    clearTimeout(this.notificationTimeout)
  }

  render() {
    const user = this.props.user
    if (!this.props.online)
      return this.renderNotOnlinePage()
    if (!isFirebaseReady(user))
      return this.renderNotReadyPage()
    else if (!isSignedIn(user))
      return this.renderSignInPage()
    return this.renderAccountPage()
  }
  renderNotOnlinePage() {
    return (
      <div className="account">
        <p className="warning notOnline">Je bent op het moment niet online. Inloggen is dus niet mogelijk.</p>
      </div>
    )
  }
  renderNotReadyPage() {
    return (
      <div className="account">
        {this.getNotification()}
        <div className="loadingIndicator">
          <span className="loadingMessage">Inlogdata checken...</span>
        </div>
      </div>
    )
  } dddd
  renderSignInPage() {
    return (
      <div className="account">
        {this.getNotification()}
        <div className="signInButtons">
          <div className="btn redirectLogin" onClick={() => this.props.signInGoogle(true)}>Log in via Google</div>
          <div className="btn redirectLogin" onClick={() => this.props.signInFacebook(true)}>Log in via Facebook</div>
          <div className="btn popupLogin" onClick={() => this.props.signInGoogle(false)}>Log in via Google</div>
          <div className="btn popupLogin" onClick={() => this.props.signInFacebook(false)}>Log in via Facebook</div>
        </div>
        <p className="signInReasons">Door in te loggen kun jij ook op de kaart aangeven waar je actief bent. Je kunt zelf aangeven of je naam en email-adres zichtbaar zijn voor anderen.</p>
      </div>
    )
  }
  renderAccountPage() {
    const user = this.props.user
    const settings = this.props.settings
    return (
      <div className="account">
        {this.getNotification()}
        <div className="signedInNote">
          <div className="signedInID">
            <span className="signedInMessage">Ingelogd als <strong>{user.name}</strong>. &lt;{user.email}&gt;</span>
          </div>
          <div className="btn" onClick={this.props.signOut}>Log uit</div>
        </div>
        <p className="explanation">Je kunt op de <Link to={{ type: 'MAP' }}>interactieve kaart</Link> markeren in welke gebieden jij actief bent als raper. Zo kun je aan anderen laten zien dat ze niet alleen bezig zijn. Hierbij laten we de volgende informatie van je zien.</p>
        <div className="settings">
          <div className="checkboxes">
            <Checkbox
              label="Je naam"
              checked={settings.showName}
              changeFunction={(newVal) => this.props.applySettings({ showName: newVal })}
            />
            <Checkbox
              label="Je afbeelding"
              checked={settings.showPicture}
              changeFunction={(newVal) => this.props.applySettings({ showPicture: newVal })}
            />
            <Checkbox
              label="Je email-adres"
              checked={settings.showEmail}
              changeFunction={(newVal) => this.props.applySettings({ showEmail: newVal })}
            />
          </div>
          <img className={classnames('picture', {visible: settings.showPicture})} src={user.picture} alt="Profielfoto" />
        </div>
        <p>De afbeelding hebben we van Google/Facebook doorgekregen toen je inlogde.</p>
      </div>
    )
  }
}

const stateMap = (state) => ({
  online: state.status.online,
  settings: getSettings(state.settings),
  user: state.user,
})
const actionMap = (dispatch) => ({
  signInGoogle: (redirect) => dispatch(userActions.signInGoogle(redirect)),
  signInFacebook: (redirect) => dispatch(userActions.signInFacebook(redirect)),
  signOut: () => dispatch(userActions.signOut()),
  applySettings: (newSettings) => dispatch(settingsActions.applySettings(newSettings)),
})
export default connect(stateMap, actionMap)(Account)