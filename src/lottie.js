import { DotLottie } from '@lottiefiles/dotlottie-web';

import './lottie.css';

document.querySelectorAll( '[data-lottie]' ).forEach( ( lottie ) => {
	const config = JSON.parse( lottie.dataset.lottie );
	const img = lottie.querySelector( 'img' );

	if ( ! img ) {
		return;
	}

	// Create canvas.
	const canvas = document.createElement( 'canvas' );
	canvas.id = config.id;
	canvas.className = img.className || '';
	const pxWidth = img.width || img.getBoundingClientRect().width || 0;
	const pxHeight = img.height || img.getBoundingClientRect().height || 0;
	canvas.width = pxWidth;
	canvas.height = pxHeight;
	if ( pxWidth && pxHeight ) {
		canvas.style.aspectRatio = `${ pxWidth } / ${ pxHeight }`;
	}

	// Append - ensure if a link is used the canvas is inside to pick up clickable area.
	img.parentElement.appendChild( canvas );

	// Add a styling hook.
	lottie.classList.add( 'lottie-initialized' );

	// Hide image if not overlaying.
	if ( ! config.overlay ) {
		lottie.classList.add( 'lottie-img-hidden' );
	}

	let playerConfig = {};

	if ( ! config.trigger ) {
		playerConfig.autoplay = true;
		playerConfig.loop = true;
	}

	let current = {};
	let dotLottie;

	function setAnimation() {
		let breakpoint = null;

		config.breakpoints.forEach( ( bp ) => {
			if ( bp.minWidth < window.innerWidth ) {
				breakpoint = bp;
			}
		} );

		if ( breakpoint && current.src !== breakpoint.src ) {
			current = breakpoint;

			if ( dotLottie ) {
				dotLottie.destroy();
			}

			dotLottie = new DotLottie( {
				canvas,
				src: breakpoint.src,
				...playerConfig,
			} );

			if ( config.trigger === 'click' ) {
				canvas.addEventListener( 'click', () => {
					dotLottie.play();
				} );
			}

			if ( config.trigger === 'hover' ) {
				canvas.addEventListener( 'mouseover', () => {
					dotLottie.setMode( 'forward' );
					dotLottie.play();
				} );
				canvas.addEventListener( 'mouseout', () => {
					dotLottie.setMode( 'reverse' );
				} );
			}
		}

		if ( ! breakpoint && ! config.overlay ) {
			lottie.classList.remove( 'lottie-img-hidden' );
		}
	}

	window.addEventListener( 'resize', () => {
		requestAnimationFrame( setAnimation );
	} );

	setAnimation();
} );
