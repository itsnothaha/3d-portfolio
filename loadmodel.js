async function loadModel(containerId, modelPath, hdriPath) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
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
    model.scale.set(1.1, 1.7, 1.1); // Increase the scale to make the model larger

    // Create a target point for the camera to look at
    const target = new THREE.Object3D();
    target.position.set(0, 1, 0); // Adjust the position as needed
    model.add(target);

    // Get the animation mixer and actions
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]); // Assuming there's only one animation
    action.play();

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
