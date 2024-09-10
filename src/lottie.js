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

	const isLazy = img.loading === 'lazy';

	// Append - ensure if a link is used the canvas is inside to pick up clickable area.
	img.parentElement.appendChild( canvas );

	// Add a styling hook.
	lottie.classList.add( 'lottie-initialized' );

	// Hide image if not overlaying.
	if ( ! config.overlay ) {
		lottie.classList.add( 'lottie-img-hidden' );
	}

	let playerConfig = {
		mode: 'forward',
		autoplay: false,
		loop: false,
	};

	if ( config?.trigger !== 'hover' ) {
		playerConfig.loop = config?.loop ?? true;
	}

	if ( config?.bounce ) {
		playerConfig.mode = 'bounce';
	}

	let current = {};
	let dotLottie;
	let observer;
	let loaded = false;
	let started = false;

	// Only animate when in view.
	observer = new IntersectionObserver(
		( entries ) => {
			entries.forEach( ( entry ) => {
				if ( ! dotLottie ) {
					return;
				}

				if ( entry.isIntersecting ) {
					if ( ! loaded && isLazy ) {
						loaded = true;
						dotLottie.load( {
							src: breakpoint.src,
						} );
					}

					if ( ! config.trigger && ! started ) {
						started = true;
						if ( dotLottie.isLoaded ) {
							dotLottie.play();
						} else {
							dotLottie.addEventListener( 'load', () => {
								dotLottie.play();
							} );
						}
					}

					dotLottie.unfreeze();
				} else {
					dotLottie.freeze();
				}
			} );
		},
		{
			threshold: [ 0, 1 ],
		}
	);

	observer.observe( canvas );

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

			if ( ! isLazy ) {
				playerConfig.src = breakpoint.src;
			}

			dotLottie = new DotLottie( {
				canvas,
				...playerConfig,
			} );

			if ( config.trigger === 'click' ) {
				canvas.addEventListener( 'click', () => {
					dotLottie.play();
				} );
			}

			if ( config.trigger === 'hover' ) {
				img.parentElement.addEventListener( 'mouseenter', () => {
					dotLottie.setMode( 'forward' );
					dotLottie.play();
				} );
				img.parentElement.addEventListener( 'mouseleave', () => {
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
