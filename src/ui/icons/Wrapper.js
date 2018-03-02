import React from 'react'
import classnames from 'classnames'

// We wrap icons in a div with an icon class for CSS styling.
export default (props) => (
	<div className={classnames('icon', props.className)}>
		{props.children}
	</div>
)