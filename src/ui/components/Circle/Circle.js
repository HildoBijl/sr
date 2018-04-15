import './Circle.css'

import React, { Component } from 'react'
import classnames from 'classnames'
import { colorToHex, lighten } from '../../colors.js'

export default class Circle extends Component {
	render() {
		const style = {
			background: colorToHex(this.props.color),
			borderColor: colorToHex(lighten(this.props.color, 0.5)),
		}
		return (
			<div className={classnames('circle', { active: this.props.active })} style={style} onClick={this.props.onClick} />
		)
	}
}