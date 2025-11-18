import { DotLottie } from '@lottiefiles/dotlottie-web';

import './lottie.css';

document.querySelectorAll( '[data-lottie]' ).forEach( ( lottie ) => {
	const config = JSON.parse( lottie.dataset.lottie );
	const img = lottie.querySelector( 'img' );

	if ( ! img ) {
		return;
	}

    // Check if this is a cover block
	const isCoverBlock = lottie.classList.contains( 'wp-block-cover');

	// Accessibility: Detect prefers-reduced-motion
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// Option: config.reducedMotionFallback: 'no-change' | 'show-first-frame' | 'show-last-frame' | 'hide'
	// Default: 'hide' (for backward compatibility)
	const fallback = config.reducedMotionFallback || 'hide';
	if (prefersReducedMotion) {
		if (fallback === 'show-first-frame' || fallback === 'show-last-frame') {
			lottie.classList.add('lottie-img-hidden');
			lottie.classList.add('lottie-lite-reduced-motion-container');
			const canvas = document.createElement('canvas');
			canvas.id = config.id;
			canvas.className = (img.className || '') + ' lottie-lite-reduced-motion-canvas';
			canvas.style.width = img.style.width || '100%';
			canvas.style.height = img.style.height || '100%';
			img.parentElement.appendChild(canvas);
			let breakpoint = null;
			config.breakpoints.forEach((bp) => {
				if (bp.minWidth < window.innerWidth) {
					breakpoint = bp;
				}
			});
			if (breakpoint) {
				const dotLottie = new DotLottie({
					canvas,
					src: breakpoint.src,
					autoplay: false,
					loop: false,
				});
				dotLottie.addEventListener('load', () => {
                    if ( fallback === 'show-first-frame' ) {
                        const firstFrame = 0;
                        dotLottie.setFrame(firstFrame);
                    } else if ( fallback === 'show-last-frame' ) {
                        const lastFrame = dotLottie.totalFrames - 1;
                        dotLottie.setFrame(lastFrame);
                    }
					dotLottie.pause();
				});
			}
			return;
		}
		if (fallback === 'hide') {
			// Show static image, do not initialize animation
			lottie.classList.remove('lottie-img-hidden');
			return;
		}
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
		autoplay: !config.trigger || config.trigger === 'autoplay',
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
				if ( entry.isIntersecting ) {
					if ( ! loaded && isLazy ) {
						loaded = true;
						setAnimation();
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

					if ( dotLottie ) {
						dotLottie.unfreeze();
					}
				} else {
					if ( dotLottie ) {
						dotLottie.freeze();
					}
				}
			} );
		},
		{
			threshold: [ 0, 1 ],
		}
	);

	observer.observe( lottie );

	function removeAnimation() {
		observer.unobserve( lottie );
		if ( dotLottie ) {
			started = false;
			loaded = false;
			dotLottie.destroy();
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

			// Extract intrinsic width & height.
			// For cover blocks, don't set aspect ratio - let it fill the container
			if ( ! isCoverBlock ) {
				if ( current.width && current.height ) {
					canvas.style.aspectRatio = `${ breakpoint.width } / ${ breakpoint.height }`;
				} else {
					const dims = canvas.getBoundingClientRect();
					canvas.style.aspectRatio = `${ dims.width } / ${ dims.height }`;
				}
			}

			// For cover blocks, use 'cover' fit to fill the entire canvas
			const lottieConfig = {
				canvas,
				src: current.src,
				...playerConfig,
			};

			if ( isCoverBlock ) {
				lottieConfig.layout = {
					fit: 'cover',
					align: [ 0.5, 0.5 ],
				};
				lottieConfig.renderConfig = {
					devicePixelRatio: window.devicePixelRatio || 1,
				};
				// Set canvas to match container dimensions
				const rect = canvas.getBoundingClientRect();
				canvas.width = rect.width;
				canvas.height = rect.height;
			}

			dotLottie = new DotLottie( lottieConfig );

			// Set a JS accessible reference on the elements.
			canvas.lottie = dotLottie;
			lottie.lottie = dotLottie;

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
					dotLottie.play();
				} );
			}

			lottie.dispatchEvent( new CustomEvent( 'lottieReady' ) );
		}

		if ( ! breakpoint ) {
			removeAnimation();
			lottie.classList.remove( 'lottie-img-hidden' );
		}
	}

	window.addEventListener( 'resize', () => {
		requestAnimationFrame( setAnimation );
	} );

	if ( ! isLazy ) {
		setAnimation();
	}
} );
