window.addEventListener('load', function() {
    // Check if any model container exists
    const modelContainers = document.querySelectorAll('[id^="model-container"]');
    if (modelContainers.length > 0) {
        // If model containers exist, wait for the models to load
        // The loader will be hidden in loadmodel.js after the models are loaded
    } else {
        // If no model containers exist, hide the loader immediately
        document.querySelector('.loader-container').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
    }
});
