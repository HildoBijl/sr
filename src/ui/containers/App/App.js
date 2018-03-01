import '../../shared/reset.css'
import '../../shared/general.css'
import './App.css'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'

import Header from '../Header/Header.js'
import Page from '../Page/Page.js'

import settingsActions from '../../../redux/settings.js'

class App extends Component {
  render() {
    return (
      <div className={classnames('app', this.props.theme)}>
        <Header />
        <Page />
      </div>
    )
  }
}

const stateMap = (state) => ({
  theme: state.settings.theme,
})
const actionMap = (dispatch) => ({})
export default connect(stateMap, actionMap)(App)