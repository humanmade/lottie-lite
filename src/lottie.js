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

	const isLazy = img.loading === 'lazy';

	// Append - ensure if a link is used the canvas is inside to pick up clickable area.
	img.parentElement.appendChild( canvas );

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
	let loaded = false;
	let started = false;

	// Only animate when in view.
	const observer = new IntersectionObserver(
		( entries ) => {
			entries.forEach( ( entry ) => {
				if ( ! dotLottie ) {
					return;
				}

				if ( entry.isIntersecting ) {
					if ( ! loaded && isLazy ) {
						loaded = true;
						dotLottie.load( {
							src: current.src,
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

	function removeAnimation() {
		if ( dotLottie ) {
			started = false;
			loaded = false;
			dotLottie.destroy();
			observer.unobserve( lottie );
		}
	}

	function setAnimation() {
		let breakpoint = null;

		config.breakpoints.forEach( ( bp ) => {
			if ( bp.minWidth < window.innerWidth ) {
				breakpoint = bp;
			}
		} );

		if ( breakpoint && current.src !== breakpoint.src ) {
			current = breakpoint;

			removeAnimation();

			if ( ! isLazy ) {
				playerConfig.src = current.src;
			}

			// Extract intrinsic width & height.
			if ( current.width && current.height ) {
				canvas.style.aspectRatio = `${ breakpoint.width } / ${ breakpoint.height }`;
			} else {
				const dims = canvas.getBoundingClientRect();
				canvas.style.aspectRatio = `${ dims.width } / ${ dims.height }`;
			}

			dotLottie = new DotLottie( {
				canvas,
				...playerConfig,
			} );

			// Set a handle on the element.
			canvas.lottie = dotLottie;

			observer.observe( lottie );

			// Add a styling hook.
			canvas.className = img.className || '';
			lottie.classList.add( 'lottie-initialized' );

			if ( config.trigger === 'click' ) {
				img.parentElement.addEventListener( 'click', () => {
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

		if ( ! breakpoint ) {
			removeAnimation();
			lottie.classList.remove( 'lottie-img-hidden' );
		}
	}

	window.addEventListener( 'resize', () => {
		requestAnimationFrame( setAnimation );
	} );

	setAnimation();
} );
