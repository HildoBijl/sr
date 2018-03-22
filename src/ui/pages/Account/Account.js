import './Account.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import userActions, { isSignedIn, isFirebaseReady } from '../../../redux/user.js'

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
          <span className="loadingMessage">We zijn even aan het checken of je ingelogd bent...</span>
        </div>
      </div>
    )
  }
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
    return (
      <div className="account">
        {this.getNotification()}
        <div className="signedInNote">
          <div className="signedInID">
            <span className="signedInMessage">Ingelogd als <strong>{user.name}</strong>. &lt;{user.email}&gt;</span>
          </div>
          <div className="btn" onClick={this.props.signOut}>Log uit</div>
        </div>
				<p>De instellingenpagina gaat nog gemaakt worden.</p>
      </div>
    )
  }
}

const stateMap = (state) => ({
	online: state.status.online,
	settings: state.settings,
	user: state.user,
})
const actionMap = (dispatch) => ({
	signInGoogle: (redirect) => dispatch(userActions.signInGoogle(redirect)),
	signInFacebook: (redirect) => dispatch(userActions.signInFacebook(redirect)),
	signOut: () => dispatch(userActions.signOut()),
})
export default connect(stateMap, actionMap)(Account)