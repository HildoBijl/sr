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

export function getDistance(a, b) { // Returns the distance in meters between two locations, with latitude and longitude known.
	// Apply the Haversine formula to get the distance between two points.
	const dLat = rad2deg(b.lat - a.lat)
	const dLng = rad2deg(b.lng - a.lng)
	const c = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad2deg(a.lat)) * Math.cos(rad2deg(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
	return 6378137 * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c)) // Multiply by Earth's radius too.
}