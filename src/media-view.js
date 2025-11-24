/* eslint object-shorthand: "off", no-unused-expressions: "off" */

import { DotLottie } from '@lottiefiles/dotlottie-web';

const AttachmentView = wp.media.view.Attachment.Library;
wp.media.view.Attachment.Library = AttachmentView.extend( {
	render: function () {
		AttachmentView.prototype.render.apply( this, arguments );

		if ( ! this.model.get( 'isLottie' ) ) {
			return this;
		}

		const img = this.el.querySelector( '.centered' );

		if ( ! img ) {
			return this;
		}

		const canvas = document.createElement( 'canvas' );
		canvas.style.aspectRatio = '1/1';
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.position = 'absolute';
		canvas.style.inset = '0 0 0 0';
		canvas.style.backgroundColor = '#fff';
		img.parentElement.style.minWidth = '150px';
		img.parentElement.appendChild( canvas );
		img.parentElement.removeChild( img );

		this.dotLottie = new DotLottie( {
			autoplay: true,
			loop: true,
			canvas,
			src: this.model.get( 'url' ),
		} );

		return this;
	},
	dispose: function () {
		AttachmentView.prototype.dispose.apply( this, arguments );
		this.dotLottie && this.dotLottie.destroy();
		return this;
	},
} );

const DetailsView = wp.media.view.Attachment.Details;
wp.media.view.Attachment.Details = DetailsView.extend( {
	render: function () {
		DetailsView.prototype.render.apply( this, arguments );

		if ( ! this.model.get( 'isLottie' ) ) {
			return this;
		}

		const img = this.el.querySelector( '.details-image' );

		if ( ! img ) {
			return this;
		}

		const canvas = document.createElement( 'canvas' );
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		img.parentElement.appendChild( canvas );
		img.parentElement.removeChild( img );

		this.dotLottie = new DotLottie( {
			autoplay: true,
			loop: true,
			canvas,
			src: this.model.get( 'url' ),
		} );

		return this;
	},
	dispose: function () {
		DetailsView.prototype.dispose.apply( this, arguments );
		this.dotLottie && this.dotLottie.destroy();
		return this;
	},
} );
