// This file contains a few useful helper functions.

export function stringCompare(A, B) {
	const a = A.toLowerCase(), b = B.toLowerCase()
	if (a < b)
		return -1
	if (a > b)
		return 1
	return 0
}