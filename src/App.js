import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <main className="site-wrap">
          <p className="App-title">
            ToDo: build the app.
          </p>
        </main>
      </div>
    );
  }
}

export default App
