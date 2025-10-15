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


	// Supports 'scroll' trigger using GSAP + ScrollTrigger
	let observer = null;
	let scrollDotLottie;
	function setupScrollAnimation() {
		setAnimation();
		scrollDotLottie = lottie.lottie;
		if (!scrollDotLottie) return;
		if (typeof scrollDotLottie.stop === 'function') scrollDotLottie.stop();
		loadGSAPScrollTrigger((gsap, ScrollTrigger) => {
			// Build start/end values based on slider controls
			const startPct = typeof config.scrollStartPct === 'number' ? config.scrollStartPct : 80;
			const endPct = typeof config.scrollEndPct === 'number' ? config.scrollEndPct : 0;
			const start = `top ${startPct}%`;
			const end = `top ${endPct}%`;
			const scrub = !!config.scrollScrub;
			if (scrub && scrollDotLottie && typeof scrollDotLottie.totalFrames === 'number') {
				// Scrub: syncs animation frame with scroll progress
				ScrollTrigger.create({
					trigger: lottie,
					start,
					end,
					scrub: true,
					onUpdate: (self) => {
						const progress = self.progress;
						const totalFrames = scrollDotLottie.totalFrames;
						if (typeof totalFrames === 'number' && totalFrames > 0) {
							const frame = Math.round(progress * (totalFrames - 1));
							if (typeof scrollDotLottie.setFrame === 'function') scrollDotLottie.setFrame(frame);
						}
					},
				});
			} else {
				// Simple trigger: animation plays when entering viewport
				ScrollTrigger.create({
					trigger: lottie,
					start,
					end,
					once: true,
					onEnter: () => {
						// Removed alert for production
						if (typeof scrollDotLottie.play === 'function') scrollDotLottie.play();
					},
				});
			}
		});
	}
	if (config.trigger === 'scroll') {
		// Initialize the animation stopped
		setupScrollAnimation();
		// Reapply on resize for breakpoints
		window.addEventListener('resize', () => {
			requestAnimationFrame(setupScrollAnimation);
		});
	} else {
		// Default trigger: IntersectionObserver
		observer = new IntersectionObserver(
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
	}

	// Remove animation and clean up observers/instances
	function removeAnimation() {
		if ( observer ) {
			observer.unobserve( lottie );
		}
		if ( dotLottie ) {
			started = false;
			loaded = false;
			dotLottie.destroy();
		}
	}

	function setAnimation() {
		let breakpoint = null;

		config.breakpoints.forEach( ( bp ) => {
			if (bp.minWidth < window.innerWidth) {
				breakpoint = bp;
			}
		} );

		if ( breakpoint && current.src !== breakpoint.src ) {
			current = breakpoint;

			removeAnimation();

			// Extract intrinsic width & height
			if ( current.width && current.height ) {
				canvas.style.aspectRatio = `${breakpoint.width} / ${breakpoint.height}`;
			} else {
				const dims = canvas.getBoundingClientRect();
				canvas.style.aspectRatio = `${ dims.width } / ${ dims.height }`;
			}

			dotLottie = new DotLottie( {
				canvas,
				src: current.src,
				...playerConfig,
			} );

			// Set a JS accessible reference on the elements
			canvas.lottie = dotLottie;
			lottie.lottie = dotLottie;

			if ( observer ) {
				observer.observe( lottie );
			}

			// Add a styling hook
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

// Detects if GSAP and ScrollTrigger are available
function loadGSAPScrollTrigger( cb ) {
	if ( window.gsap && window.ScrollTrigger ) {
		cb( window.gsap, window.ScrollTrigger );
		return;
	}
	
	let tries = 0;
	const interval = setInterval(() => {
		if ( window.gsap && window.ScrollTrigger ) {
			clearInterval( interval );
			cb( window.gsap, window.ScrollTrigger );
		} else if ( ++tries > 20 ) {
			clearInterval( interval );
		}
	}, 200);
}
