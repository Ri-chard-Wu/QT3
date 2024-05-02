import {
	BoxGeometry,

	CylinderGeometry,
	DoubleSide,
	Euler,

	LineBasicMaterial,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	OctahedronGeometry,
	PlaneGeometry,
	Quaternion,
	Raycaster,

	TorusGeometry,
	Vector3
} from 'three';

const _raycaster$1 = new Raycaster();

const _tempVector = new Vector3();
const _tempVector2 = new Vector3();
const _tempQuaternion = new Quaternion();
const _unit = {
	X: new Vector3( 1, 0, 0 ),
	Y: new Vector3( 0, 1, 0 ),
	Z: new Vector3( 0, 0, 1 )
};



const _changeEvent$2 = { type: 'change' };
const _mouseDownEvent = { type: 'mouseDown' };
const _mouseUpEvent = { type: 'mouseUp', mode: null };
const _objectChangeEvent = { type: 'objectChange' };

class TransformControls extends Object3D {

	constructor( camera, domElement ) {

		super();

		if ( domElement === undefined ) {

			console.warn( 'THREE.TransformControls: The second parameter "domElement" is now mandatory.' );
			domElement = document;

		}

		this.isTransformControls = true;

		this.visible = false;
		this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll

		const _gizmo = new TransformControlsGizmo();
		this._gizmo = _gizmo;
		this.add( _gizmo );

		const _plane = new TransformControlsPlane();
		this._plane = _plane;
		this.add( _plane );

		const scope = this;

		// Defined getter, setter and store for a property
		function defineProperty( propName, defaultValue ) {

			let propValue = defaultValue;

			Object.defineProperty( scope, propName, {

				get: function () {

					return propValue !== undefined ? propValue : defaultValue;

				},

				set: function ( value ) {

					if ( propValue !== value ) {

						propValue = value;
						_plane[ propName ] = value;
						_gizmo[ propName ] = value;

						scope.dispatchEvent( { type: propName + '-changed', value: value } );
						scope.dispatchEvent( _changeEvent$2 );

					}

				}

			} );

			scope[ propName ] = defaultValue;
			_plane[ propName ] = defaultValue;
			_gizmo[ propName ] = defaultValue;

		}

		// Define properties with getters/setter
		// Setting the defined property will automatically trigger change event
		// Defined properties are passed down to gizmo and plane

		defineProperty( 'camera', camera );
		defineProperty( 'object', undefined );
		defineProperty( 'enabled', true );
		defineProperty( 'axis', null );
		defineProperty( 'mode', 'translate' );
		defineProperty( 'space', 'world' );
		defineProperty( 'size', 1 );
		defineProperty( 'dragging', false );
		defineProperty( 'showX', true );
		defineProperty( 'showY', true );
		defineProperty( 'showZ', true );

		// Reusable utility variables

		const worldPosition = new Vector3();
		const worldPositionStart = new Vector3();
		const worldQuaternion = new Quaternion();
		const worldQuaternionStart = new Quaternion();
		const cameraPosition = new Vector3();
		const cameraQuaternion = new Quaternion();
		const pointStart = new Vector3();
		const pointEnd = new Vector3();
		const rotationAxis = new Vector3();
		const rotationAngle = 0;
		const eye = new Vector3();

		// TODO: remove properties unused in plane and gizmo

		defineProperty( 'worldPosition', worldPosition );
		defineProperty( 'worldPositionStart', worldPositionStart );
		defineProperty( 'worldQuaternion', worldQuaternion );
		defineProperty( 'worldQuaternionStart', worldQuaternionStart );
		defineProperty( 'cameraPosition', cameraPosition );
		defineProperty( 'cameraQuaternion', cameraQuaternion );
		defineProperty( 'pointStart', pointStart );
		defineProperty( 'pointEnd', pointEnd );
		defineProperty( 'rotationAxis', rotationAxis );
		defineProperty( 'rotationAngle', rotationAngle );
		defineProperty( 'eye', eye );

		this._offset = new Vector3();
		this._startNorm = new Vector3();
		this._endNorm = new Vector3();
		this._cameraScale = new Vector3();

		this._parentPosition = new Vector3();
		this._parentQuaternion = new Quaternion();
		this._parentQuaternionInv = new Quaternion();
		this._parentScale = new Vector3();

		this._worldScaleStart = new Vector3();
		this._worldQuaternionInv = new Quaternion();
		this._worldScale = new Vector3();

		this._positionStart = new Vector3();
		this._quaternionStart = new Quaternion();
		this._scaleStart = new Vector3();




		// mouse / touch event handlers

		function getPointer( event ) {

			if ( this.domElement.ownerDocument.pointerLockElement ) {

				return {
					x: 0,
					y: 0,
					button: event.button
				};

			} else {

				const rect = this.domElement.getBoundingClientRect();

				return {
					x: ( event.clientX - rect.left ) / rect.width * 2 - 1,
					y: - ( event.clientY - rect.top ) / rect.height * 2 + 1,
					button: event.button
				};

			}

		}

		function onPointerHover( event ) {


	

			if ( ! this.enabled ) return;

			switch ( event.pointerType ) {

				case 'mouse':
				case 'pen':
					this.pointerHover( this._getPointer( event ) );
					break;

			}

		}

		function onPointerDown( event ) {

			if ( ! this.enabled ) return;

			if ( ! document.pointerLockElement ) {

				this.domElement.setPointerCapture( event.pointerId );

			}

			this.domElement.addEventListener( 'pointermove', this._onPointerMove );

			this.pointerHover( this._getPointer( event ) );
			this.pointerDown( this._getPointer( event ) );

		}

		function onPointerMove( event ) {

			if ( ! this.enabled ) return;

			this.pointerMove( this._getPointer( event ) );

		}

		function onPointerUp( event ) {

			if ( ! this.enabled ) return;

			this.domElement.releasePointerCapture( event.pointerId );

			this.domElement.removeEventListener( 'pointermove', this._onPointerMove );

			this.pointerUp( this._getPointer( event ) );

		}

		function intersectObjectWithRay( object, raycaster, includeInvisible ) {

			const allIntersections = raycaster.intersectObject( object, true );

			for ( let i = 0; i < allIntersections.length; i ++ ) {

				if ( allIntersections[ i ].object.visible || includeInvisible ) {

					return allIntersections[ i ];

				}

			}

			return false;
		}	
		
		
		this._getPointer = getPointer.bind( this );
		this._onPointerDown = onPointerDown.bind( this );
		this._onPointerHover = onPointerHover.bind( this );
		this._onPointerMove = onPointerMove.bind( this );
		this._onPointerUp = onPointerUp.bind( this );
		this._intersectObjectWithRay = intersectObjectWithRay.bind( this );


		this.domElement.addEventListener( 'pointerdown', this._onPointerDown );
		this.domElement.addEventListener( 'pointermove', this._onPointerHover );
		this.domElement.addEventListener( 'pointerup', this._onPointerUp );
	}



	// updateMatrixWorld  updates key transformation variables
	updateMatrixWorld() {

		if ( this.object !== undefined ) {

			this.object.updateMatrixWorld();

			if ( this.object.parent === null ) {

				console.error( 'TransformControls: The attached 3D object must be a part of the scene graph.' );

			} else {

				this.object.parent.matrixWorld.decompose( this._parentPosition, this._parentQuaternion, this._parentScale );

			}

			this.object.matrixWorld.decompose( this.worldPosition, this.worldQuaternion, this._worldScale );

			this._parentQuaternionInv.copy( this._parentQuaternion ).invert();
			this._worldQuaternionInv.copy( this.worldQuaternion ).invert();

		}

		this.camera.updateMatrixWorld();
		this.camera.matrixWorld.decompose( this.cameraPosition, this.cameraQuaternion, this._cameraScale );

		if ( this.camera.isOrthographicCamera ) {

			this.camera.getWorldDirection( this.eye ).negate();

		} 
        else {

			this.eye.copy( this.cameraPosition ).sub( this.worldPosition ).normalize();
		}

		super.updateMatrixWorld( this );
	}



	pointerHover( pointer ) {

		if ( this.object === undefined || this.dragging === true ) return;

		_raycaster$1.setFromCamera( pointer, this.camera );




		const intersect = this._intersectObjectWithRay( this._gizmo.gizmo, _raycaster$1 );

   

		if ( intersect ) {

            this.mode = intersect.object.mode;
			this.axis = intersect.object.name;

		} else {

			this.axis = null;

		}
	}


	pointerDown( pointer ) {

		if ( this.object === undefined || this.dragging === true || pointer.button !== 0 ) return;

		if ( this.axis !== null ) {

			_raycaster$1.setFromCamera( pointer, this.camera );

			const planeIntersect = this._intersectObjectWithRay( this._plane, _raycaster$1, true );

			if ( planeIntersect ) {

				this.object.updateMatrixWorld();
				this.object.parent.updateMatrixWorld();

				this._positionStart.copy( this.object.position );
				this._quaternionStart.copy( this.object.quaternion );
				this._scaleStart.copy( this.object.scale );

				this.object.matrixWorld.decompose( this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart );

				this.pointStart.copy( planeIntersect.point ).sub( this.worldPositionStart );

			}

			this.dragging = true;
			_mouseDownEvent.mode = this.mode;
			this.dispatchEvent( _mouseDownEvent );

		}
	}


	pointerMove( pointer ) {

		const axis = this.axis;
		const mode = this.mode;
		const object = this.object;
		let space = this.space;

		if ( axis === 'E' || axis === 'XYZE' || axis === 'XYZ' ) {

			space = 'world';

		}

		if ( object === undefined || axis === null || this.dragging === false || pointer.button !== - 1 ) return;

		_raycaster$1.setFromCamera( pointer, this.camera );

		const planeIntersect = this._intersectObjectWithRay( this._plane, _raycaster$1, true );

		if ( ! planeIntersect ) return;


		this.pointEnd.copy( planeIntersect.point ).sub( this.worldPositionStart );

		if ( mode === 'translate' ) {

			// Apply translate

			this._offset.copy( this.pointEnd ).sub( this.pointStart );

			if ( space === 'local' && axis !== 'XYZ' ) { 

				this._offset.applyQuaternion( this._worldQuaternionInv );

			}

			if ( axis.indexOf( 'X' ) === - 1 ) this._offset.x = 0;
			if ( axis.indexOf( 'Y' ) === - 1 ) this._offset.y = 0;
			if ( axis.indexOf( 'Z' ) === - 1 ) this._offset.z = 0;

			if ( space === 'local' && axis !== 'XYZ' ) { // no

				this._offset.applyQuaternion( this._quaternionStart ).divide( this._parentScale );

			} else {

				this._offset.applyQuaternion( this._parentQuaternionInv ).divide( this._parentScale );

			}

			object.position.copy( this._offset ).add( this._positionStart );

		} 
        else if ( mode === 'rotate' ) {

			this._offset.copy( this.pointEnd ).sub( this.pointStart );

			const ROTATION_SPEED = 20 / this.worldPosition.distanceTo( _tempVector.setFromMatrixPosition( this.camera.matrixWorld ) );

			if ( axis === 'E' ) {

				this.rotationAxis.copy( this.eye );
				this.rotationAngle = this.pointEnd.angleTo( this.pointStart );

				this._startNorm.copy( this.pointStart ).normalize();
				this._endNorm.copy( this.pointEnd ).normalize();

				this.rotationAngle *= ( this._endNorm.cross( this._startNorm ).dot( this.eye ) < 0 ? 1 : - 1 );

			} else if ( axis === 'XYZE' ) {

				this.rotationAxis.copy( this._offset ).cross( this.eye ).normalize();
				this.rotationAngle = this._offset.dot( _tempVector.copy( this.rotationAxis ).cross( this.eye ) ) * ROTATION_SPEED;

			} else if ( axis === 'X' || axis === 'Y' || axis === 'Z' ) {

				this.rotationAxis.copy( _unit[ axis ] );

				_tempVector.copy( _unit[ axis ] );

				if ( space === 'local' ) {

					_tempVector.applyQuaternion( this.worldQuaternion );

				}

				this.rotationAngle = this._offset.dot( _tempVector.cross( this.eye ).normalize() ) * ROTATION_SPEED;

			}


			// Apply rotate
			if ( space === 'local' && axis !== 'E' && axis !== 'XYZE' ) { // no

				object.quaternion.copy( this._quaternionStart );
				object.quaternion.multiply( _tempQuaternion.setFromAxisAngle( this.rotationAxis, this.rotationAngle ) ).normalize();

			} else {

				this.rotationAxis.applyQuaternion( this._parentQuaternionInv );
				object.quaternion.copy( _tempQuaternion.setFromAxisAngle( this.rotationAxis, this.rotationAngle ) );
				object.quaternion.multiply( this._quaternionStart ).normalize();

			}

		}

		this.dispatchEvent( _changeEvent$2 );
		this.dispatchEvent( _objectChangeEvent );
	}



	pointerUp( pointer ) {

		if ( pointer.button !== 0 ) return;

		if ( this.dragging && ( this.axis !== null ) ) {

			_mouseUpEvent.mode = this.mode;
			this.dispatchEvent( _mouseUpEvent );

		}

		this.dragging = false;
		this.axis = null;
	}



	dispose() {

		this.domElement.removeEventListener( 'pointerdown', this._onPointerDown );
		this.domElement.removeEventListener( 'pointermove', this._onPointerHover );
		this.domElement.removeEventListener( 'pointermove', this._onPointerMove );
		this.domElement.removeEventListener( 'pointerup', this._onPointerUp );

		this.traverse( function ( child ) {
			if ( child.geometry ) child.geometry.dispose();
			if ( child.material ) child.material.dispose();
		} );
	}


	// Set current object
	attach( object ) {

		this.object = object;
		this.visible = true;

		return this;
	}

	// Detach from object
	detach() {

		this.object = undefined;
		this.visible = false;
		this.axis = null;

		return this;
	}


	reset() {

		if ( ! this.enabled ) return;

		if ( this.dragging ) {

			this.object.position.copy( this._positionStart );
			this.object.quaternion.copy( this._quaternionStart );
			this.object.scale.copy( this._scaleStart );

			this.dispatchEvent( _changeEvent$2 );
			this.dispatchEvent( _objectChangeEvent );

			this.pointStart.copy( this.pointEnd );

		}
	}


	getRaycaster() {
		return _raycaster$1;
	}

	getMode() {
		return this.mode;
	}

	setMode( mode ) {
		this.mode = mode;
	}

	setSize( size ) {
		this.size = size;
	}

	setSpace( space ) {
		this.space = space;
	}
}






// Reusable utility variables

const _tempEuler = new Euler();
const _alignVector = new Vector3( 0, 1, 0 );
const _zeroVector = new Vector3( 0, 0, 0 );
const _lookAtMatrix = new Matrix4();
const _tempQuaternion2 = new Quaternion();
const _identityQuaternion = new Quaternion();
const _dirVector = new Vector3();
const _tempMatrix = new Matrix4();

const _unitX = new Vector3( 1, 0, 0 );
const _unitY = new Vector3( 0, 1, 0 );
const _unitZ = new Vector3( 0, 0, 1 );

const _v1$8 = new Vector3();
const _v2$5 = new Vector3();
const _v3$2 = new Vector3();

class TransformControlsGizmo extends Object3D {

	constructor() {

		super();

		this.isTransformControlsGizmo = true;

		this.type = 'TransformControlsGizmo';

		// shared materials

		const gizmoMaterial = new MeshBasicMaterial( {
			depthTest: false,
			depthWrite: false,
			fog: false,
			toneMapped: false,
			transparent: true
		} );

		const gizmoLineMaterial = new LineBasicMaterial( {
			depthTest: false,
			depthWrite: false,
			fog: false,
			toneMapped: false,
			transparent: true
		} );

		// Make unique material for each axis/color

		const matInvisible = gizmoMaterial.clone();
		matInvisible.opacity = 0.15;

		
		const matRed = gizmoMaterial.clone();
		matRed.color.setHex( 0xee0000 );

		const matGreen = gizmoMaterial.clone();
		matGreen.color.setHex( 0x00ee00 );

		const matBlue = gizmoMaterial.clone();
		matBlue.color.setHex( 0x0000ee );



		const matRedTransparent = gizmoMaterial.clone();
		matRedTransparent.color.setHex( 0xff0000 );
		matRedTransparent.opacity = 0.5;

		const matGreenTransparent = gizmoMaterial.clone();
		matGreenTransparent.color.setHex( 0x00ff00 );
		matGreenTransparent.opacity = 0.5;

		const matBlueTransparent = gizmoMaterial.clone();
		matBlueTransparent.color.setHex( 0x0000ff );
		matBlueTransparent.opacity = 0.5;

		const matWhiteTransparent = gizmoMaterial.clone();
		matWhiteTransparent.opacity = 0.25;

		const matYellowTransparent = gizmoMaterial.clone();
		matYellowTransparent.color.setHex( 0xffff00 );
		matYellowTransparent.opacity = 0.25;

		const matYellow = gizmoMaterial.clone();
		matYellow.color.setHex( 0xffff00 );

		const matGray = gizmoMaterial.clone();
		matGray.color.setHex( 0x787878 );

		// reusable geometry

        // radiusTop, radiusBottom, height, radialSegments
        let arrowLength = 0.2;
		const arrowGeometry = new CylinderGeometry( 0, 0.06, arrowLength, 12 );
		arrowGeometry.translate( 0, 0.05, 0 );

	
        // radiusTop, radiusBottom, height, radialSegments
		const lineGeometry = new CylinderGeometry( 0.025, 0.025, 0.5, 3 );
		lineGeometry.translate( 0, 0.25, 0 );



        
		let torusRadius = 0.65;
		let totalArcAngle = (Math.PI / 2) * 0.85;
        let arrowArcAngle = arrowLength / torusRadius;
        let torusArcAngle = totalArcAngle - arrowArcAngle;
		let arcCenterAngle = Math.PI / 4;
		
        let a1 = arcCenterAngle - totalArcAngle / 2 + arrowArcAngle;
        
		// radius, tube, radialSegments, tubularSegments
		const torusGeometry = new TorusGeometry( torusRadius, 0.025, 20, 24, torusArcAngle);


	

		const gizmoRotate = {

			X: [
				[ new Mesh(torusGeometry, matRed.clone() ), [ 0, 0, 0 ], [ 0, - Math.PI / 2, arcCenterAngle -  totalArcAngle / 2 + arrowArcAngle]],

                [ new Mesh( arrowGeometry, matRed.clone() ), 
					[0, torusRadius * Math.sin(a1), torusRadius * Math.cos(a1) ], 
					[ Math.PI - a1, 0, 0 ]],	
			],            

			Y: [
				[ new Mesh(torusGeometry, matGreen.clone() ), [ 0, 0, 0 ], [ Math.PI / 2, 0, arcCenterAngle -  totalArcAngle / 2 + arrowArcAngle]],
                
				[ new Mesh( arrowGeometry, matGreen.clone() ), 
					[torusRadius * Math.cos(a1), 0, torusRadius * Math.sin(a1) ], 
					[ 0, Math.PI / 2 - a1, - Math.PI / 2 ]],				
			],

			Z: [
				[ new Mesh(torusGeometry, matBlue.clone() ), [ 0, 0, 0 ], [ 0, 0, arcCenterAngle -  totalArcAngle / 2]],

                [ new Mesh( arrowGeometry, matBlue.clone() ), 
					[torusRadius * Math.sin(a1) , torusRadius * Math.cos(a1), 0], 
					[ 0, 0, Math.PI / 2 - a1]],				
			],            
		};


	
		const gizmoTranslate = {
			X: [
				[ new Mesh( arrowGeometry, matRed ), [ 0.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ]],
				[ new Mesh( lineGeometry, matRed ), [ 0, 0, 0 ], [ 0, 0, - Math.PI / 2 ]]
			],
			Y: [
				[ new Mesh( arrowGeometry, matGreen ), [ 0, 0.5, 0 ]],
				[ new Mesh( lineGeometry, matGreen ) ]
			],
			Z: [
				[ new Mesh( arrowGeometry, matBlue ), [ 0, 0, 0.5 ], [ Math.PI / 2, 0, 0 ]],
				[ new Mesh( lineGeometry, matBlue ), null, [ Math.PI / 2, 0, 0 ]]
			],
			XYZ: [
				[ new Mesh( new OctahedronGeometry( 0.1, 0 ), matWhiteTransparent.clone() ), [ 0, 0, 0 ]]
			],
			XY: [
				[ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matBlueTransparent.clone() ), [ 0.15, 0.15, 0 ]]
			],
			YZ: [
				[ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matRedTransparent.clone() ), [ 0, 0.15, 0.15 ], [ 0, Math.PI / 2, 0 ]]
			],
			XZ: [
				[ new Mesh( new BoxGeometry( 0.15, 0.15, 0.01 ), matGreenTransparent.clone() ), [ 0.15, 0, 0.15 ], [ - Math.PI / 2, 0, 0 ]]
			]
		};



        

		// const pickerTranslate = {
		// 	X: [
		// 		[ new Mesh( new CylinderGeometry( 0.2, 0, 0.6, 4 ), matInvisible ), [ 0.3, 0, 0 ], [ 0, 0, - Math.PI / 2 ]],
		// 		[ new Mesh( new CylinderGeometry( 0.2, 0, 0.6, 4 ), matInvisible ), [ - 0.3, 0, 0 ], [ 0, 0, Math.PI / 2 ]]
		// 	],
		// 	Y: [
		// 		[ new Mesh( new CylinderGeometry( 0.2, 0, 0.6, 4 ), matInvisible ), [ 0, 0.3, 0 ]],
		// 		[ new Mesh( new CylinderGeometry( 0.2, 0, 0.6, 4 ), matInvisible ), [ 0, - 0.3, 0 ], [ 0, 0, Math.PI ]]
		// 	],
		// 	Z: [
		// 		[ new Mesh( new CylinderGeometry( 0.2, 0, 0.6, 4 ), matInvisible ), [ 0, 0, 0.3 ], [ Math.PI / 2, 0, 0 ]],
		// 		[ new Mesh( new CylinderGeometry( 0.2, 0, 0.6, 4 ), matInvisible ), [ 0, 0, - 0.3 ], [ - Math.PI / 2, 0, 0 ]]
		// 	],
		// 	XYZ: [
		// 		[ new Mesh( new OctahedronGeometry( 0.2, 0 ), matInvisible ) ]
		// 	],
		// 	XY: [
		// 		[ new Mesh( new BoxGeometry( 0.2, 0.2, 0.01 ), matInvisible ), [ 0.15, 0.15, 0 ]]
		// 	],
		// 	YZ: [
		// 		[ new Mesh( new BoxGeometry( 0.2, 0.2, 0.01 ), matInvisible ), [ 0, 0.15, 0.15 ], [ 0, Math.PI / 2, 0 ]]
		// 	],
		// 	XZ: [
		// 		[ new Mesh( new BoxGeometry( 0.2, 0.2, 0.01 ), matInvisible ), [ 0.15, 0, 0.15 ], [ - Math.PI / 2, 0, 0 ]]
		// 	]
		// };



		// const pickerRotate = {
		// 	XYZE: [
		// 		[ new Mesh( new SphereGeometry( 0.25, 10, 8 ), matInvisible ) ]
		// 	],
		// 	X: [
		// 		[ new Mesh( new TorusGeometry( 0.5, 0.1, 4, 24 ), matInvisible ), [ 0, 0, 0 ], [ 0, - Math.PI / 2, - Math.PI / 2 ]],
		// 	],
		// 	Y: [
		// 		[ new Mesh( new TorusGeometry( 0.5, 0.1, 4, 24 ), matInvisible ), [ 0, 0, 0 ], [ Math.PI / 2, 0, 0 ]],
		// 	],
		// 	Z: [
		// 		[ new Mesh( new TorusGeometry( 0.5, 0.1, 4, 24 ), matInvisible ), [ 0, 0, 0 ], [ 0, 0, - Math.PI / 2 ]],
		// 	],
		// 	E: [
		// 		[ new Mesh( new TorusGeometry( 0.75, 0.1, 2, 24 ), matInvisible ) ]
		// 	]
		// };



		
		function setupGizmo( gizmo, gizmoMap, mode ) {

			// const gizmo = new Object3D();

			for ( const name in gizmoMap ) {

				for ( let i = gizmoMap[ name ].length; i --; ) {

					const object = gizmoMap[ name ][ i ][ 0 ].clone();
					const position = gizmoMap[ name ][ i ][ 1 ];
					const rotation = gizmoMap[ name ][ i ][ 2 ];

					object.name = name;
                    object.mode = mode;
	

					if ( position ) {

						object.position.set( position[ 0 ], position[ 1 ], position[ 2 ] );

					}

					if ( rotation ) {

						object.rotation.set( rotation[ 0 ], rotation[ 1 ], rotation[ 2 ] );

					}


					object.updateMatrix();

					const tempGeometry = object.geometry.clone();
					tempGeometry.applyMatrix4( object.matrix );
					object.geometry = tempGeometry;
					object.renderOrder = Infinity;

					object.position.set( 0, 0, 0 );
					object.rotation.set( 0, 0, 0 );
					object.scale.set( 1, 1, 1 );

					gizmo.add( object );

				}

			}

			// return gizmo;

		}
        

		// Gizmo creation

		
		// this.picker = {};

        const gizmo = new Object3D();
        this.gizmo = gizmo;
        this.add(gizmo);
        

        setupGizmo(gizmo, gizmoTranslate, 'translate' );
        setupGizmo(gizmo, gizmoRotate, 'rotate' );

		// this.add( this.gizmo[ 'translate' ] = setupGizmo(gizmo, gizmoTranslate, 'translate' ) );
		// this.add( this.gizmo[ 'rotate' ] = setupGizmo(gizmo, gizmoRotate, 'rotate' ) );

		// this.add( this.picker[ 'translate' ] = setupGizmo( pickerTranslate, 'translate' ) );
		// this.add( this.picker[ 'rotate' ] = setupGizmo( pickerRotate, 'rotate' ) );
		

		// Pickers should be hidden always

		// this.picker[ 'translate' ].visible = false;
		// this.picker[ 'rotate' ].visible = false;

        // this.gizmo[ 'translate' ].visible = true;
		// this.gizmo[ 'rotate' ].visible = true;

        this.gizmo.visible = true;

	
	}



	// updateMatrixWorld will update transformations and appearance of individual handles

	updateMatrixWorld( force ) {

		const space = this.space; // scale always oriented to local rotation

		const quaternion = ( space === 'local' ) ? this.worldQuaternion : _identityQuaternion;

		// Show only gizmos for current transform mode

		// this.gizmo[ 'translate' ].visible = this.mode === 'translate';
		// this.gizmo[ 'rotate' ].visible = this.mode === 'rotate';


		let handles = [];
		// handles = handles.concat( this.picker[ this.mode ].children );
		// handles = handles.concat( this.gizmo[ this.mode ].children );

        // handles = handles.concat( this.gizmo[ 'translate' ].children );
        // handles = handles.concat( this.gizmo[ 'rotate' ].children );
        handles = handles.concat( this.gizmo.children );
		

        // console.log(`this.axis: ${this.axis}, this.mode: ${this.mode}`);


		for ( let i = 0; i < handles.length; i ++ ) {

			const handle = handles[ i ];

			// hide aligned to camera

			handle.visible = true;
			handle.rotation.set( 0, 0, 0 );
			handle.position.copy( this.worldPosition );

			let factor;

			if ( this.camera.isOrthographicCamera ) {

				factor = ( this.camera.top - this.camera.bottom ) / this.camera.zoom;

			} else {

				factor = this.worldPosition.distanceTo( this.cameraPosition ) * Math.min( 1.9 * Math.tan( Math.PI * this.camera.fov / 360 ) / this.camera.zoom, 7 );

			}

			// handle.scale.set( 1, 1, 1 ).multiplyScalar( factor * this.size / 4 );
            handle.scale.set( 1, 1, 1 ).multiplyScalar(150);



			// Align handles to current local or world rotation

			handle.quaternion.copy( quaternion );



			// Hide disabled axes
			handle.visible = handle.visible && ( handle.name.indexOf( 'X' ) === - 1 || this.showX );
			handle.visible = handle.visible && ( handle.name.indexOf( 'Y' ) === - 1 || this.showY );
			handle.visible = handle.visible && ( handle.name.indexOf( 'Z' ) === - 1 || this.showZ );
			handle.visible = handle.visible && ( handle.name.indexOf( 'E' ) === - 1 || ( this.showX && this.showY && this.showZ ) );

			// highlight selected axis

			handle.material._color = handle.material._color || handle.material.color.clone();
			handle.material._opacity = handle.material._opacity || handle.material.opacity;

			handle.material.color.copy( handle.material._color );
			handle.material.opacity = handle.material._opacity;

			if ( this.enabled && this.axis && handle.mode === this.mode ) {


				if ( handle.name === this.axis) {


					handle.material.color.setHex( 0xffff00 );
					handle.material.opacity = 1.0;

				} 
                else if ( this.axis.split( '' ).some( function ( a ) {return handle.name === a;} ) ) 
                {

					handle.material.color.setHex( 0xffff00 );
					handle.material.opacity = 1.0;

				}

			}

		}


		super.updateMatrixWorld( force );

	}

}



class TransformControlsPlane extends Mesh {

	constructor() {

		super(
			new PlaneGeometry( 100000, 100000, 2, 2 ),
			new MeshBasicMaterial( { visible: false, wireframe: true, side: DoubleSide, transparent: true, opacity: 0.1, toneMapped: false } )
			// new PlaneGeometry( 100, 100, 5, 5 ),
			// new MeshBasicMaterial( { visible: true, wireframe: true, side: DoubleSide, transparent: false, opacity: 0.1, toneMapped: false } )			
		);

		this.isTransformControlsPlane = true;

		this.type = 'TransformControlsPlane';

	}

	updateMatrixWorld( force ) {

		let space = this.space;

		this.position.copy( this.worldPosition );


		_v1$8.copy( _unitX ).applyQuaternion( space === 'local' ? this.worldQuaternion : _identityQuaternion );
		_v2$5.copy( _unitY ).applyQuaternion( space === 'local' ? this.worldQuaternion : _identityQuaternion );
		_v3$2.copy( _unitZ ).applyQuaternion( space === 'local' ? this.worldQuaternion : _identityQuaternion );

		// Align the plane for current transform mode, axis and space.

		_alignVector.copy( _v2$5 );

		switch ( this.mode ) {

			case 'translate':
				switch ( this.axis ) {

					case 'X':
						_alignVector.copy( this.eye ).cross( _v1$8 );
						_dirVector.copy( _v1$8 ).cross( _alignVector );
						break;
					case 'Y':
						_alignVector.copy( this.eye ).cross( _v2$5 );
						_dirVector.copy( _v2$5 ).cross( _alignVector );
						break;
					case 'Z':
						_alignVector.copy( this.eye ).cross( _v3$2 );
						_dirVector.copy( _v3$2 ).cross( _alignVector );
						break;
					case 'XY':
						_dirVector.copy( _v3$2 );
						break;
					case 'YZ':
						_dirVector.copy( _v1$8 );
						break;
					case 'XZ':
						_alignVector.copy( _v3$2 );
						_dirVector.copy( _v2$5 );
						break;
					case 'XYZ':
					case 'E':
						_dirVector.set( 0, 0, 0 );
						break;

				}

				break;
			case 'rotate':
			default:
				// special case for rotate
				_dirVector.set( 0, 0, 0 );

		}

		if ( _dirVector.length() === 0 ) {

			// If in rotate mode, make the plane parallel to camera
			this.quaternion.copy( this.cameraQuaternion );

		} else {

			_tempMatrix.lookAt( _tempVector.set( 0, 0, 0 ), _dirVector, _alignVector );

			this.quaternion.setFromRotationMatrix( _tempMatrix );

		}

		super.updateMatrixWorld( force );

	}

}




export { TransformControls, TransformControlsGizmo, TransformControlsPlane, _objectChangeEvent };