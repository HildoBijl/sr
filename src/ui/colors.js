const colors = [
	[244, 67, 54],
	[233, 30, 99],
	[156, 39, 176],
	[103, 58, 183],
	[63, 81, 181],
	[33, 150, 24],
	[33, 169, 244],
	[0, 188, 212],
	[0, 150, 136],
	[76, 175, 80],
	[139, 195, 74],
	[205, 220, 57],
	[255, 235, 59],
	[255, 193, 7],
	[255, 152, 0],
	[255, 87, 34],
	[121, 85, 72],
	[158, 158, 158],
	[96, 125, 139],
	[47, 47, 47],
]
export default colors

export function getRandomColor() {
	return colors[Math.floor(Math.random()*colors.length)]
}

export function colorToHex(color) {
	return '#' + color.map(numToHex).join('')
}

export function hexToColor(hex) {
	return hex.slice(1).match(/.{1,2}/g).map(hex => parseInt(hex, 16))
}

export function darken(color, factor) {
	return color.map(num => Math.round(num*(1 - factor)))
}

export function lighten(color, factor) {
	return color.map(num => Math.round(255 - (255 - num)*(1 - factor)))
}

function numToHex(num) {
	return ('0' + (Number(num).toString(16))).slice(-2).toUpperCase()
}