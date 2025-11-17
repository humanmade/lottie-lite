import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	PanelRow,
	SelectControl,
	ToggleControl,
	RangeControl,
} from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { DotLottie } from '@lottiefiles/dotlottie-web';
import LottieLogo from '../assets/lottie-logo.png';

import './editor.css';

const SUPPORTED_BLOCKS = [ 'core/image', 'core/cover', 'core/media-text' ];

function useLottie( args = {} ) {
	const dotLottie = useRef( null );
	const ref = useCallback(
		( canvas ) => {
			if ( dotLottie.current ) {
				dotLottie.current.destroy();
			}

			if (
				canvas &&
				canvas.tagName &&
				canvas.tagName === 'CANVAS' &&
				args.src
			) {
				dotLottie.current = new DotLottie( {
					autoplay: true,
					loop: true,
					canvas,
					...args,
				} );
			}
		},
		[ args ]
	);

	return [ ref, dotLottie ];
}

function Animation( { src } ) {
	const [ ref, dotLottie ] = useLottie( { src } );

	if ( ! src || ! dotLottie ) {
		return null;
	}

	return (
		<canvas
			ref={ ref }
			style={ { aspectRatio: '4/3', width: '100%', height: 'auto' } }
		></canvas>
	);
}

function LottieAnimationPanel( BlockEdit ) {
	return ( props ) => {
		const { attributes, name, setAttributes } = props;

		if ( SUPPORTED_BLOCKS.indexOf( name ) < 0 ) {
			return <BlockEdit { ...props } />;
		}

		const { lottie } = attributes;

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody
						title={ __( 'Lottie Animation', 'lottie-lite' ) }
						initialOpen={ !! lottie?.breakpoints?.length }
						icon={
							<img
								src={ LottieLogo }
								style={ { width: '1.1em', height: '1.1em' } }
							/>
						}
					>
						<SelectControl
							label={ __( 'Interaction', 'lottie-lite' ) }
							value={ lottie?.trigger || '' }
							options={ [
								{
									label: __( 'Autoplay', 'lottie-lite' ),
									value: '',
								},
								{
									label: __( 'Hover', 'lottie-lite' ),
									value: 'hover',
								},
								{
									label: __( 'Click', 'lottie-lite' ),
									value: 'click',
								},
							] }
							onChange={ ( value ) =>
								setAttributes( {
									lottie: { ...lottie, trigger: value },
								} )
							}
						/>
						<SelectControl
							label={ __( 'Reduced motion fallback', 'lottie-lite' ) }
							value={ lottie?.reducedMotionFallback || 'hide' }
							options={ [
								{
									label: __( 'No change (always show animation)', 'lottie-lite' ),
									value: 'no-change',
								},
                                {
									label: __( 'Show first frame (static)', 'lottie-lite' ),
									value: 'show-first-frame',
								},
								{
									label: __( 'Show last frame (static)', 'lottie-lite' ),
									value: 'show-last-frame',
								},
								{
									label: __( 'Hide animation (show image only)', 'lottie-lite' ),
									value: 'hide',
								},
							] }
							onChange={ ( value ) =>
								setAttributes( {
									lottie: { ...lottie, reducedMotionFallback: value },
								} )
							}
							help={ __( 'Fallback for users with "prefers-reduced-motion" enabled.', 'lottie-lite' ) }
						/>
						<ToggleControl
							label={ __( 'Overlay', 'lottie-lite' ) }
							checked={ lottie?.overlay }
							defaultChecked={ false }
							onChange={ ( value ) =>
								setAttributes( {
									lottie: { ...lottie, overlay: value },
								} )
							}
							help={
								lottie?.overlay
									? __(
											'Animation will be overlaid on the image',
											'lottie-lite'
									  )
									: __(
											'The image will be replaced by the animation',
											'lottie-lite'
									  )
							}
						/>
						{ lottie?.trigger !== 'hover' && (
							<ToggleControl
								label={ __( 'Loop', 'lottie-lite' ) }
								help={
									lottie?.loop ?? true
										? __(
												'The animation will loop continuously',
												'lottie-lite'
										  )
										: __(
												'The animation will play only once',
												'lottie-lite'
										  )
								}
								checked={ lottie?.loop ?? true }
								defaultChecked={ true }
								onChange={ ( value ) =>
									setAttributes( {
										lottie: { ...lottie, loop: value },
									} )
								}
							/>
						) }
						{ lottie?.bounce !== 'hover' && (
							<ToggleControl
								label={ __( 'Bounce', 'lottie-lite' ) }
								help={
									lottie?.bounce ?? false
										? __(
												'The animation will play in reverse once it reaches the end',
												'lottie-lite'
										  )
										: __(
												'The animation will stop once it reaches the end',
												'lottie-lite'
										  )
								}
								checked={ lottie?.bounce ?? false }
								defaultChecked={ false }
								onChange={ ( value ) =>
									setAttributes( {
										lottie: { ...lottie, bounce: value },
									} )
								}
							/>
						) }
						{ ( lottie?.breakpoints || [] ).map(
							( breakpoint, index ) => (
								<div
									key={ `lottie-lite-bp-${ index }` }
									className="lottie-lite__panel"
								>
									<PanelRow>
										<label className="lottie-lite__label">
											{ sprintf(
												__(
													'Breakpoint: Above %dpx',
													'lottie-lite'
												),
												breakpoint.minWidth || 0
											) }
										</label>
										<Button
											variant="tertiary"
											icon="trash"
											iconSize={ 14 }
											title={ __(
												'Remove Breakpoint',
												'lottie-lite'
											) }
											size="small"
											isDestructive
											onClick={ () => {
												const updatedBreakpoints = [
													...lottie.breakpoints,
												];
												updatedBreakpoints.splice(
													index,
													1
												);
												setAttributes( {
													lottie: {
														...lottie,
														breakpoints:
															updatedBreakpoints,
													},
												} );
											} }
										/>
									</PanelRow>
									<div style={ { marginBlockEnd: '1rem' } }>
										<MediaUploadCheck>
											<MediaUpload
												onSelect={ ( media ) => {
													const updatedBreakpoints = [
														...lottie.breakpoints,
													];
													updatedBreakpoints[
														index
													].file = media.id;
													updatedBreakpoints[
														index
													].src = media.url;
													setAttributes( {
														lottie: {
															...lottie,
															breakpoints:
																updatedBreakpoints,
														},
													} );
												} }
												allowedTypes={ [
													'application/json',
													'application/zip',
												] }
												value={ breakpoint.file }
												render={ ( { open } ) => (
													<>
														<Animation
															src={
																breakpoint.src
															}
														/>
														<Button
															onClick={ open }
															variant="secondary"
														>
															{ __(
																'Select Animation',
																'lottie-lite'
															) }
														</Button>
													</>
												) }
											/>
										</MediaUploadCheck>
									</div>
									<RangeControl
										value={ breakpoint.minWidth || 0 }
										max={ 2400 }
										min={ 0 }
										onChange={ ( value ) => {
											const updatedBreakpoints = [
												...lottie.breakpoints,
											];
											updatedBreakpoints[
												index
											].minWidth = value;
											setAttributes( {
												lottie: {
													...lottie,
													breakpoints:
														updatedBreakpoints,
												},
											} );
										} }
										__nextHasNoMarginBottom
									/>
								</div>
							)
						) }
						<Button
							variant="primary"
							onClick={ () => {
								const updatedBreakpoints = [
									...( lottie?.breakpoints || [] ),
								];
								updatedBreakpoints.push( {
									file: null,
									minWidth: 0,
								} );
								setAttributes( {
									lottie: {
										...( lottie || {} ),
										breakpoints: updatedBreakpoints,
									},
								} );
							} }
						>
							{ __(
								'Add Animation / Breakpoint',
								'lottie-lite'
							) }
						</Button>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}

addFilter(
	'editor.BlockEdit',
	'lottie-lite/animation-panel',
	LottieAnimationPanel
);

function addAttribute( settings ) {
	if ( SUPPORTED_BLOCKS.indexOf( settings.name ) < 0 ) {
		return settings;
	}

	   return {
		   ...settings,
		   attributes: {
			   ...settings.attributes,
			   lottie: {
				   type: 'object',
				   properties: {
					   breakpoints: {
						   type: 'array',
						   items: {
							   type: 'object',
							   properties: {
								   file: {
									   type: 'number',
									   description: 'The Lottie file ID',
								   },
								   src: {
									   type: 'string',
									   description: 'The Lottie file URL',
								   },
								   minWidth: {
									   type: 'number',
									   description:
										   'The size at which to stop showing animation',
									   default: 0,
								   },
							   },
						   },
					   },
					   trigger: {
						   type: 'string',
						   enum: [ '', 'click', 'hover' ],
						   default: '',
					   },
					   overlay: {
						   type: 'bool',
						   default: false,
					   },
					   loop: {
						   type: 'bool',
						   default: true,
					   },
					   reducedMotionFallback: {
						   type: 'string',
						   enum: [ 'no-change', 'show-last-frame', 'hide' ],
						   default: 'hide',
						   description: 'Fallback for prefers-reduced-motion users',
					   },
				   },
			   },
			   lottieFile: {
				   type: 'number',
			   },
		   },
	   };
}

addFilter(
	'blocks.registerBlockType',
	'lottie-lite/add-attribute',
	addAttribute
);
