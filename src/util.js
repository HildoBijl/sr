// This file contains a few useful helper functions.

import React from 'react'

export function getMailLink() {
	const mail = 'info@stillerapers.nl'
	return <a href={`mailto: ${mail}`}>{mail}</a>
}

export function stringCompare(A, B) {
	const a = A.toLowerCase(), b = B.toLowerCase()
	if (a < b)
		return -1
	if (a > b)
		return 1
	return 0
}

export function rad2deg(v) {
	return v * Math.PI / 180
}