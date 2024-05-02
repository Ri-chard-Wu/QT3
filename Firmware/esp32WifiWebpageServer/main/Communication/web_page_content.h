
#ifndef WEB_PAGE_CONTENT
#define WEB_PAGE_CONTENT

char root_web_page[] = "<!DOCTYPE html>\
<html lang=\"en\">\
	<head>\
		<title>QT3-Dashboard</title>\
		<meta charset=\"utf-8\">\
		<meta name=\"viewport\" content=\"width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0\">\
\
		 \
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/3d_viewer.css\"> \
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/Slider.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/KeyframeEditor.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/Window.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/EndEffectorInfo.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/CentralWindow.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/Select.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/LinearSlider.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/LineChart.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/Tab.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/ResizableTable.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/TrackballControlsGizmo.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/ViewCube.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/UserModeHelper.css\">\
		<link rel=\"stylesheet\" href=\"http://192.168.1.145:8080/css/WorkSpaceSphereCtrl.css\">\
		\
		 \
\
		<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/prism/1.15.0/themes/prism.min.css\"/> \
		\
		<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\
		<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\
		<link href=\"https://fonts.googleapis.com/css2?family=Roboto:wght@100&display=swap\" rel=\"stylesheet\">\
\
		<style>\
		 \
		\
		</style>\
	</head>\
\
	<body>\
  \
		<div class=\"dashboard\">  \
			<canvas id=\"webgl-canvas\"></canvas> \
			<div id=\"webgl-content\"> </div> \
		</div>     \
		 \
\
		<script type=\"importmap\">\
			{\
				\"imports\": {\
					\"three\": \"http://192.168.1.145:8080/js/threejs/build/three.module.js\",\
					\"three/addons/\": \"http://192.168.1.145:8080/js/threejs/jsm/\",\
					\"html2canvas\": \"http://192.168.1.145:8080/js/html2canvas/html2canvas.js\"\
				}\
			}\
		</script>\
 \
\
		<script type=\"module\">\
\
			import * as THREE from 'three';\
			import { TrackballControls } from 'three/addons/controls/TrackballControls.js';\
			import { OrbitControls } from 'three/addons/controls/OrbitControls.js';\
			import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';\
			import { QT3 } from 'http://192.168.1.145:8080/js/qt3_lib/QT3.js';\
			import { LinkFrameHelper } from 'http://192.168.1.145:8080/js/qt3_lib/QT3vir.js';					\
 \
\
			let webglContent = document.getElementById( 'webgl-content' );\
			let webglCanvas = document.getElementById( 'webgl-canvas' );\
\
			\
			const scenes = [];\
	\
						let renderer = new THREE.WebGLRenderer( {canvas: webglCanvas,  antialias: true, preserveDrawingBuffer: true} );\
			renderer.setPixelRatio( window.devicePixelRatio );\
			            renderer.setClearColor( 0x000000, 0 );\
\
			renderer.webglContent = webglContent;\
			renderer.webglCanvas = webglCanvas;\
			renderer.scenes = {};\
\
 \
\
			let model_scene = make_model_scene(); \
			renderer.scenes['model'] = model_scene;\
\
			let viewCube_scene = make_viewCube_scene();\
 			renderer.scenes['viewCube'] = viewCube_scene;\
			\
		 \
\
\
\
			window.addEventListener( 'resize', onWindowResize ); \
			\
\
			const esp32Deploy = true;\
			console.log(`esp32Deploy: ${esp32Deploy}`);\
			const dashboard = document.getElementsByClassName('dashboard')[0];\
			const qt3 = new QT3(model_scene, dashboard, renderer, 'http://192.168.1.145:8080/assets/QT3-v5_mesh_color_v8.obj', esp32Deploy);\
\
\
			\
			animate();\
\
\
 \
 \
\
			\
			function make_viewCube_scene() {\
				 \
                const scene = new THREE.Scene(); \
				scene.background = new THREE.Color( 0x011b29 );\
                make_scene_content_dom(scene, 'viewCube-scene');\
                 \
				const aspect = window.innerWidth / window.innerHeight;\
				let camera = new THREE.PerspectiveCamera( 60, aspect, 1, 4000 );\
                                camera.position.z = 2;\
                scene.userData.camera = camera;\
   \
  \
                const controls = new OrbitControls( scene.userData.camera, scene.userData.element );\
                controls.minDistance = 2;\
                controls.maxDistance = 5;\
				controls.rotateSpeed = 0.5;\
                controls.enablePan = false;\
                controls.enableZoom = false;\
                scene.userData.controls = controls;\
 \
\
                scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444, 7 ) );\
      \
				const ambientLight = new THREE.AmbientLight( 0x555555, 15);\
				scene.add( ambientLight );\
\
 \
				let geometry = new THREE.BoxGeometry( 1, 1, 1 );\
\
			  \
				let texts = ['LEFT','RIGHT', 'TOP', 'BOTTOM', 'BACK', 'FRONT'];\
				const materials = [];\
				for(let i = 0;i<6;i++){\
\
					let size = 200;\
\
					const canvas = document.createElement('canvas');            \
					canvas.width = canvas.height = size;\
					\
					const ctx = canvas.getContext('2d');\
\
					const texture = new THREE.Texture(canvas);\
					texture.needsUpdate = true;\
\
					const material = new THREE.MeshStandardMaterial({ map: texture });\
					materials.push(material);\
		\
					ctx.font = 'bold 30pt Arial'; \
					ctx.fillStyle = `rgb(22, 78, 99)`; \
\
					ctx.fillRect(0, 0, canvas.width, canvas.height);\
\
					ctx.strokeStyle = \"rgb(0,255,255)\";\
					ctx.shadowColor=\"rgb(0,255,255)\"; \
					ctx.shadowBlur=10;\
					ctx.lineWidth=5;\
					ctx.strokeRect(0, 0, canvas.width, canvas.height);\
\
					ctx.shadowColor=\"rgb(255,255,255)\"; \
					ctx.shadowBlur=10;\
					ctx.lineWidth=5;\
					ctx.strokeRect(0, 0, canvas.width, canvas.height);\
\
\
\
					ctx.textAlign = 'center';\
					ctx.textBaseline = 'middle';\
\
					ctx.shadowColor=\"rgb(0,255,255)\";\
										ctx.lineWidth=2;\
					ctx.strokeText(texts[i], canvas.width / 2, canvas.height / 2);\
\
					ctx.shadowBlur=0;\
					ctx.fillStyle = 'rgb(255, 255, 255)';\
					ctx.fillText(texts[i], canvas.width / 2, canvas.height / 2);\
				}\
				 \
				scene.add(new THREE.Mesh( geometry, materials ));\
				  \
 \
				function setupGizmo( scene, gizmoMap ) {\
   \
					for ( const name in gizmoMap ) {\
\
						for ( let i = gizmoMap[ name ].length; i --; ) {\
\
							const object = gizmoMap[ name ][ i ][ 0 ].clone();\
							const position = gizmoMap[ name ][ i ][ 1 ];\
							const rotation = gizmoMap[ name ][ i ][ 2 ];\
\
							object.name = name;\
						 \
\
							if ( position ) { \
								object.position.set( position[ 0 ], position[ 1 ], position[ 2 ] ); \
							}\
\
							if ( rotation ) { \
								object.rotation.set( rotation[ 0 ], rotation[ 1 ], rotation[ 2 ] ); \
							}\
\
\
							object.updateMatrix();\
\
							const tempGeometry = object.geometry.clone();\
							tempGeometry.applyMatrix4( object.matrix );\
							object.geometry = tempGeometry;\
							object.renderOrder = Infinity;\
 \
							object.position.set( -0.5,-0.5,-0.5);\
							object.rotation.set( 0, 0, 0 );\
							object.scale.set( 1, 1, 1 ); \
							scene.add( object ); \
						}\
\
					} \
\
				}\
						\
				const gizmoMaterial = new THREE.MeshBasicMaterial( { \
					fog: false, \
				} );\
		\
				\
				const matRed = gizmoMaterial.clone();\
				matRed.color.setHex( 0xee0000 );\
\
				const matGreen = gizmoMaterial.clone();\
				matGreen.color.setHex( 0x00ee00 );\
\
				const matBlue = gizmoMaterial.clone();\
				matBlue.color.setHex( 0x0000ee );\
\
 \
\
				const lineGeometry = new THREE.CylinderGeometry( 0.025, 0.025, 1.2, 3 );\
				lineGeometry.translate( 0, 0.6, 0 );				\
				 \
				const gizmoTranslate = {\
					X: [\
						[ new THREE.Mesh( lineGeometry, matRed ), [ 0, 0, 0 ], [ 0, 0, - Math.PI / 2 ]]\
					],\
					Y: [\
						[ new THREE.Mesh( lineGeometry, matGreen ), null, null]\
					],\
					Z: [\
						[ new THREE.Mesh( lineGeometry, matBlue ), null, [ Math.PI / 2, 0, 0 ]]\
					]\
	\
				};\
\
				setupGizmo(scene, gizmoTranslate);\
 \
\
				return scene;\
			}\
\
\
			\
			function make_model_scene() {\
				\
				let scene = new THREE.Scene(); \
				scene.background = new THREE.Color( 0x011b29 );\
\
\
				make_scene_content_dom(scene, 'model-scene');\
\
				const aspect = window.innerWidth / window.innerHeight;\
				let perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 4000 );\
				scene.userData.camera = perspectiveCamera;\
 \
 \
                const controls = new OrbitControls( scene.userData.camera, scene.userData.element );\
                controls.minDistance = 600;\
                controls.maxDistance = 10000;\
                controls.enablePan = false; \
\
				controls.enableZoom = true; \
\
                scene.userData.controls = controls;\
 \
				const top = 4;\
				const hor = 4;\
				const intensity = 2;\
\
				const dirLight1 = new THREE.DirectionalLight( 0xffffff, intensity );\
				dirLight1.position.set( hor, top, 0); \
				scene.add( dirLight1 );\
\
				const dirLight2 = new THREE.DirectionalLight( 0xffffff, intensity );\
				dirLight2.position.set( 0, top,  -hor );\
				scene.add( dirLight2 );\
\
				const dirLight3 = new THREE.DirectionalLight( 0xffffff, intensity );\
				dirLight3.position.set( 0, top, hor);\
				scene.add( dirLight3 );\
\
								\
				const ambientLight = new THREE.AmbientLight( 0x555555, 2);\
				scene.add( ambientLight );\
				return scene;\
			}	\
\
\
\
			function make_scene_content_dom(scene, className){\
                \
 \
                const element = document.createElement( 'div' );\
                element.className = className;\
  \
                scene.userData.element = element;\
\
                webglContent.appendChild( element );\
\
            }\
 \
			function onWindowResize() { \
				qt3.onWindowResize();  \
			} \
\
			function animate() {\
\
				render();\
				requestAnimationFrame( animate );\
\
			}\
\
\
\
			function updateSize() {\
\
                const width = webglCanvas.clientWidth;\
                const height = webglCanvas.clientHeight;\
\
                if ( webglCanvas.width !== width || webglCanvas.height !== height ) {\
\
                    renderer.setSize( width, height, false );\
                }\
\
            }\
\
 \
			\
\
\
			function render() {\
 \
				updateSize();\
\
				webglCanvas.style.transform = `translateY(${window.scrollY}px)`;\
 \
				renderer.setScissorTest( false );\
				renderer.clear(); \
				renderer.setScissorTest( true );\
\
\
				for (const [name, scene] of Object.entries(renderer.scenes)) {\
				 \
					const element = scene.userData.element;\
\
 					const rect = element.getBoundingClientRect();\
 \
					const width = rect.right - rect.left;\
					const height = rect.bottom - rect.top;\
					const left = rect.left;\
					const bottom = renderer.domElement.clientHeight - rect.bottom;\
    \
					renderer.setViewport( left, bottom, width, height );\
					renderer.setScissor( left, bottom, width, height );\
\
					const camera = scene.userData.camera;\
\
					camera.aspect = width / height;\
					camera.updateProjectionMatrix(); \
					renderer.render( scene, camera );\
				}\
			}\
\
 \
		</script>\
\
	</body>\
</html>";


#endif