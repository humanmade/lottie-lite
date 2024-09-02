import { DotLottie } from '@lottiefiles/dotlottie-web';

import './lottie.css';

document.querySelectorAll( '[data-lottie]' ).forEach( ( lottie ) => {
	const config = JSON.parse( lottie.dataset.lottie );
	const img = lottie.querySelector( 'img' );

	// Create canvas.
	const canvas = document.createElement( 'canvas' );
	canvas.className = img?.className || '';
	canvas.id = config.id;
	canvas.style.width =
		img?.width || img?.getBoundingClientRect().width || '100%';
	canvas.style.height =
		img?.height || img?.getBoundingClientRect().height || 'auto';
	canvas.style.aspectRatio = `${ img.width } / ${ img.height }`;

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
				canvas.addEventListener( 'mouseenter', () => {
					dotLottie.setMode( 'forward' );
					dotLottie.play();
				} );
				canvas.addEventListener( 'mouseleave', () => {
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
