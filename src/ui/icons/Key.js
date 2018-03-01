import React from 'react'
import Wrapper from './Wrapper.js'

export default () => (
	// First the key outline (starting top, going CCW), then the key cut (starting left bottom, going CW) and finally the ellipse (starting bottom right, going CW). Margin on the left and right is 1.2.
	<Wrapper>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.5 127.5">
			<g>
				<path d="
					M87.8,0
					c-21.1,0-38.3,17.1-38.3,38.3
					c0,3.9,0.6,7.6,1.7,11.2
					l-50,50
					v28
					h28
					v-14
					h14
					v-14
					h14
					v-14
					h14
					l8-8
					c2.8,0.7,5.8,1,8.8,1
					c21.1,0,38.3-17.1,38.3-38.3
					s-17.4,-40.2,-38.5,-40.2z

					M6.5,109.3
					v-7.3
					l47-47
					c0.8,1.6,1.7,3.1,2.7,4.6
					l-49.7,49.7z

					M113.2,40.6
					c-4.7,5.1-15,3.2-22.9-4.3
					s-10.5-17.5-5.8-22.6
					c4.7-5.1,15-3.2,22.9,4.3
					c7.9,7.5,10.5,17.6,5.8,22.6z
				"	/>
			</g>
		</svg>
	</Wrapper>
)