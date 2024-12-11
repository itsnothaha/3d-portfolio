async function loadModel(containerId, modelPath, hdriPath) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // shadows
    document.getElementById(containerId).appendChild(renderer.domElement);

    // Load the HDRI texture in EXR format
    const exrLoader = new THREE.EXRLoader();
    const texture = await new Promise((resolve, reject) => {
        exrLoader.load(hdriPath, resolve, undefined, reject);
    });
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Create a PMREM generator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Generate the PMREM cube UV texture
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    // Set the environment map for lighting
    scene.environment = envMap;

    // Set the intensity of the environment map
    scene.environment.intensity = 1; // Adjust the intensity as needed

    // Dispose of the PMREM generator
    pmremGenerator.dispose();

    // Load the GLB model
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
        loader.load(modelPath, resolve, undefined, reject);
    });
    const model = gltf.scene;
    scene.add(model);
    model.position.set(0, 0, 0);
    model.scale.set(1.1, 1.9, 1.1); // Increase the scale to make the model larger

    // Create a target point for the camera to look at
    const target = new THREE.Object3D();
    target.position.set(0, 1, 0); // Adjust the position as needed
    model.add(target);

    // Get the animation mixer and actions
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]); // Assuming there's only one animation
    action.play();


    // Find the head bone within the metarig
    let headBone = null;
    model.traverse((child) => {
        if (child.isBone && child.name === 'head') {
            headBone = child;
            console.log('Head bone found:', headBone);
        }
    });

    if (!headBone) {
        console.error('Head bone not found in the model.');
    } else {
        // Apply initial rotation to the head bone using quaternions
        const initialQuaternion = new THREE.Quaternion();
        initialQuaternion.setFromEuler(new THREE.Euler(0, 0, 0, 'XYZ'));
        headBone.quaternion.copy(initialQuaternion);
    }

    // Add event listener for mouse movement
    document.addEventListener('mousemove', (event) => {
        if (headBone) {
            const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

            // Calculate the angle to look at the mouse position
            const vector = new THREE.Vector3(-mouseX, -mouseY, 0.5);
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const targetPosition = new THREE.Vector3().addVectors(camera.position, dir.multiplyScalar(10));

            

            // Rotate the head bone to look at the target position
            headBone.lookAt(targetPosition);

            // Apply an additional 180-degree rotation around the Y-axis
            const additionalRotation = new THREE.Quaternion();
            additionalRotation.setFromEuler(new THREE.Euler(0, Math.PI, 0, 'YXZ'));
            headBone.quaternion.multiply(additionalRotation);

            // Limit the rotation around the X-axis
            const euler = new THREE.Euler();
            euler.setFromQuaternion(headBone.quaternion, 'XYZ');
            euler.x = Math.max(Math.min(euler.x, Math.PI ), Math.PI / 4); // Limit to ±45 degrees
            euler.y = Math.max(Math.min(euler.y, Math.PI / 4), -Math.PI / 4); // Limit to ±45 degrees
            euler.z = Math.max(Math.min(euler.z, Math.PI / 6), -Math.PI / 6); // Limit to ±45 degrees

            euler.x += 0.3; // Add a small offset to look slightly lower
            headBone.quaternion.setFromEuler(euler);
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Update the animation mixer
        mixer.update(0.016); // Update the mixer with the delta time (16ms)

        camera.lookAt(target.position); // Make the camera look at the target point
        renderer.render(scene, camera);
    }
    animate();

    // Set the camera position
    camera.position.z = 4;
    camera.position.y = 2;


    return scene;
}

// Example usage
loadModel('model-container2', 'girl2.glb', 'hdri.exr').then(() => {
    document.querySelector('.loader-container').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
}).catch(error => {
    console.error('An error occurred while loading the model:', error);
});












