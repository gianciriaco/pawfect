document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    
    // Check if Three.js is loaded and canvas exists
    if (!typeof THREE === 'undefined' || !canvas) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Allows CSS background to show through
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 2. Create Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700; // Number of particles

    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        // Spread particles randomly in 3D space
        posArray[i] = (Math.random() - 0.5) * 15; // Range -7.5 to 7.5
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Get theme colors from CSS
    const computedStyle = getComputedStyle(document.body);
    // Default to Gold/Yellow if variable not found
    const particleColor = computedStyle.getPropertyValue('--accent-color-light').trim() || '#fbb901';

    const material = new THREE.PointsMaterial({
        size: 0.02,
        color: particleColor, 
        transparent: true,
        opacity: 0.8,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // 3. Lighting (Optional for particles, but good for meshes)
    const pointLight = new THREE.PointLight(0xffffff, 0.1);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    camera.position.z = 3;

    // 4. Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // 5. Animation Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Rotate entire system slowly
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        // Mouse Parallax Effect (Smooth)
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        particlesMesh.rotation.y += 0.5 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    }

    tick();

    // 6. Handle Window Resize
    window.addEventListener('resize', () => {
        // Update sizes
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Update camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // 7. Theme Change Listener (To update particle color)
    // Checks if body class changes to update particle color dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const newStyle = getComputedStyle(document.body);
                const newColor = newStyle.getPropertyValue('--accent-color-light').trim();
                if(newColor) {
                    particlesMesh.material.color.set(newColor);
                }
            }
        });
    });
    
    observer.observe(document.body, { attributes: true });
});