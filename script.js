document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const generateBtn = document.getElementById('generateBtn');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const pixelArtContainer = document.getElementById('pixelArtContainer');
    const originalPreview = document.getElementById('originalPreview');
    const pixelArtCanvas = document.getElementById('pixelArtCanvas');
    const editorModal = document.getElementById('editorModal');
    const editorGrid = document.getElementById('editorGrid');
    const colorPicker = document.getElementById('colorPicker');
    const saveEditsBtn = document.getElementById('saveEditsBtn');
    const closeEditorBtn = document.getElementById('closeEditorBtn');
    const filenameInput = document.getElementById('filenameInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const buttonContainer = document.getElementById('buttonContainer');
    
    const PIXEL_SIZE = 32; // Fixed 32x32 pixel art
    let originalImage = null;
    let isDrawing = false;
    let originalPixelArt = null; // Store the original pixel art state

    // Monkey animation frames (32x32 ASCII art converted to pixels)
    const monkeyFrames = [
        // Frame 1 - dancing monkey (simplified 32x32 representation)
        [
            "................................",
            "...........######..............",
            "..........##....##............",
            ".........##......##...........",
            "........##........##..........",
            "........##..####..##..........",
            "........##..####..##..........",
            ".........##......##...........",
            "..........########............",
            "........####..####...........",
            ".......##..####..##..........",
            "......##....##....##.........",
            ".....##......##.....##........",
            "....##........##.....##.......",
            "...##..........##.....##......",
            "..##............##.....##.....",
            ".##..............##.....##....",
            "##................##.....##...",
            ".##...............##.....##...",
            "..##..............##....##....",
            "...##.............##...##.....",
            "....##............##..##......",
            ".....##...........####........",
            "......##..........##..........",
            ".......##........##...........",
            "........##......##............",
            ".........##....##.............",
            "..........######..............",
            "............##................",
            "............##................",
            "...........####...............",
            "................................"
        ],
        // Frame 2 - dancing monkey (arms up)
        [
            "................................",
            "...........######..............",
            "..........##....##............",
            ".........##......##...........",
            "........##........##..........",
            "........##..####..##..........",
            "........##..####..##..........",
            ".........##......##...........",
            "..........########............",
            ".......##..####..##..........",
            "......##....##....##.........",
            ".....##......##......##.......",
            "....##........##......##......",
            "...##..........##......##.....",
            "..##............##......##....",
            ".##..............##......##...",
            "##................##.....##...",
            ".##................##....##...",
            "..##...............##...##....",
            "...##..............##..##.....",
            "....##.............####.......",
            ".....##............##.........",
            "......##...........##.........",
            ".......##..........##.........",
            "........##.........##.........",
            ".........##........##.........",
            "..........##......##..........",
            "...........##....##...........",
            "............######............",
            "..............##..............",
            ".............####.............",
            "................................"
        ]
    ];

    // Loading overlay elements
    let loadingOverlay = null;
    let loadingCanvas = null;
    let loadingText = null;

    // Create loading overlay
    function createLoadingOverlay() {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        
        loadingCanvas = document.createElement('canvas');
        loadingCanvas.width = PIXEL_SIZE * 8; // Larger size for visibility
        loadingCanvas.height = PIXEL_SIZE * 8;
        loadingCanvas.style.imageRendering = 'pixelated';
        
        loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Loading...';
        
        loadingOverlay.appendChild(loadingCanvas);
        loadingOverlay.appendChild(loadingText);
        document.body.appendChild(loadingOverlay);
    }

    // Animate monkey
    function animateMonkey() {
        const ctx = loadingCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        let frameIndex = 0;
        
        return setInterval(() => {
            ctx.clearRect(0, 0, loadingCanvas.width, loadingCanvas.height);
            const frame = monkeyFrames[frameIndex];
            
            for (let y = 0; y < PIXEL_SIZE; y++) {
                for (let x = 0; x < PIXEL_SIZE; x++) {
                    if (frame[y][x] === '#') {
                        ctx.fillStyle = '#4CAF50';
                        ctx.fillRect(x * 8, y * 8, 8, 8);
                    }
                }
            }
            
            frameIndex = (frameIndex + 1) % monkeyFrames.length;
        }, 500); // Switch frames every 500ms
    }

    // Show loading animation
    function showLoading() {
        if (!loadingOverlay) {
            createLoadingOverlay();
        }
        loadingOverlay.style.display = 'flex';
        return animateMonkey();
    }

    // Hide loading animation
    function hideLoading(animationInterval) {
        if (loadingOverlay) {
            clearInterval(animationInterval);
            loadingOverlay.style.display = 'none';
        }
    }

    // Color filters presets
    const filters = {
        normal: (r, g, b) => [r, g, b],
        grayscale: (r, g, b) => {
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            return [gray, gray, gray];
        },
        sepia: (r, g, b) => {
            const tr = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189));
            const tg = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168));
            const tb = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131));
            return [tr, tg, tb];
        },
        negative: (r, g, b) => [255 - r, 255 - g, 255 - b],
        retro: (r, g, b) => [
            Math.min(255, r * 1.2),
            Math.min(255, g * 0.9),
            Math.min(255, b * 0.7)
        ]
    };

    // Handle image upload
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const animationInterval = showLoading();

        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage = new Image();
            originalImage.onload = () => {
                // Show original preview
                originalPreview.src = event.target.result;
                pixelArtContainer.style.display = 'block';
                
                // Set canvas to 32x32
                pixelArtCanvas.width = PIXEL_SIZE;
                pixelArtCanvas.height = PIXEL_SIZE;
                
                // Set display size (larger than actual pixels for visibility)
                pixelArtCanvas.style.width = '300px';
                pixelArtCanvas.style.height = '300px';
                pixelArtCanvas.style.imageRendering = 'pixelated';

                // Update button states
                document.getElementById('uploadContainer').style.display = 'none';
                buttonContainer.className = 'button-container show-generate';
                generateBtn.disabled = false;
                editBtn.disabled = true;
                saveBtn.disabled = true;

                // Hide loading after a short delay to ensure image is rendered
                setTimeout(() => {
                    hideLoading(animationInterval);
                }, 1000);
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Apply color filter to image
    function applyFilter(filterName, permanent = false) {
        const ctx = pixelArtCanvas.getContext('2d');
        
        // If not permanent, start from the original state
        if (!permanent && originalPixelArt) {
            ctx.putImageData(originalPixelArt, 0, 0);
        }
        
        const imageData = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        const data = imageData.data;
        const filter = filters[filterName];

        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = filter(data[i], data[i + 1], data[i + 2]);
            data[i] = Math.round(r / 51) * 51;     // Quantize to 8-bit
            data[i + 1] = Math.round(g / 51) * 51;
            data[i + 2] = Math.round(b / 51) * 51;
        }

        ctx.putImageData(imageData, 0, 0);
        
        // If this is a permanent change, update the original state
        if (permanent) {
            originalPixelArt = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        }
        
        createEditorGrid(); // Update the editor grid
    }

    // Function to convert image to pixel art
    async function convertToPixelArt() {
        if (!originalImage) return;

        const animationInterval = showLoading();
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const ctx = pixelArtCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        ctx.clearRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        ctx.drawImage(originalImage, 0, 0, PIXEL_SIZE, PIXEL_SIZE);
        
        applyFilter('normal', true); // Apply normal filter to quantize colors
        
        // Store the original pixel art state
        originalPixelArt = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        
        hideLoading(animationInterval);
        
        // Update button states
        buttonContainer.className = 'button-container show-edit show-save';
        generateBtn.style.display = 'none';
        editBtn.disabled = false;
        saveBtn.disabled = false;
    }

    // Function to create the editor grid
    function createEditorGrid() {
        editorGrid.innerHTML = '';
        const ctx = pixelArtCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        const data = imageData.data;

        for (let y = 0; y < PIXEL_SIZE; y++) {
            for (let x = 0; x < PIXEL_SIZE; x++) {
                const index = (y * PIXEL_SIZE + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                const pixel = document.createElement('div');
                pixel.className = 'pixel-cell';
                pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                pixel.dataset.x = x;
                pixel.dataset.y = y;
                
                editorGrid.appendChild(pixel);
            }
        }
    }

    // Function to update canvas from editor
    function updateCanvasFromEditor() {
        const ctx = pixelArtCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        const data = imageData.data;

        const pixels = editorGrid.getElementsByClassName('pixel-cell');
        Array.from(pixels).forEach((pixel, index) => {
            const color = pixel.style.backgroundColor;
            const rgb = color.match(/\d+/g).map(Number);
            const dataIndex = index * 4;
            
            data[dataIndex] = rgb[0];
            data[dataIndex + 1] = rgb[1];
            data[dataIndex + 2] = rgb[2];
            data[dataIndex + 3] = 255;
        });

        ctx.putImageData(imageData, 0, 0);
    }

    // Function to save the pixel art
    function savePixelArt(autoSave = false) {
        if (!pixelArtCanvas) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const customName = filenameInput.value.trim();
        const filename = customName ? `${customName}.png` : `pixel-art-${timestamp}.png`;
        
        const saveCanvas = document.createElement('canvas');
        saveCanvas.width = PIXEL_SIZE;
        saveCanvas.height = PIXEL_SIZE;
        const saveCtx = saveCanvas.getContext('2d');
        saveCtx.imageSmoothingEnabled = false;
        saveCtx.drawImage(pixelArtCanvas, 0, 0);
        
        if (autoSave) {
            const imageData = {
                filename: filename,
                timestamp: new Date().toISOString(),
                dataUrl: saveCanvas.toDataURL('image/png')
            };

            let savedImages = JSON.parse(sessionStorage.getItem('pixelArtHistory') || '[]');
            savedImages.unshift(imageData);
            
            if (savedImages.length > 50) {
                savedImages = savedImages.slice(0, 50);
            }
            
            sessionStorage.setItem('pixelArtHistory', JSON.stringify(savedImages));
        }

        if (!autoSave) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = saveCanvas.toDataURL('image/png');
            link.click();
        }
    }

    // Event Listeners
    generateBtn.addEventListener('click', () => {
        convertToPixelArt();
        savePixelArt(true);
    });
    
    saveBtn.addEventListener('click', () => savePixelArt(false));

    editBtn.addEventListener('click', () => {
        createEditorGrid();
        editorModal.style.display = 'block';
        // Adjust editor grid size on open
        adjustEditorSize();
    });

    closeEditorBtn.addEventListener('click', () => {
        editorModal.style.display = 'none';
    });

    saveEditsBtn.addEventListener('click', () => {
        updateCanvasFromEditor();
        // Make the current state permanent
        const ctx = pixelArtCanvas.getContext('2d');
        originalPixelArt = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
        savePixelArt(true);
        editorModal.style.display = 'none';
    });

    // Editor drawing functionality
    editorGrid.addEventListener('mousedown', () => isDrawing = true);
    editorGrid.addEventListener('mouseup', () => isDrawing = false);
    editorGrid.addEventListener('mouseleave', () => isDrawing = false);

    editorGrid.addEventListener('mouseover', (e) => {
        if (!isDrawing) return;
        const pixel = e.target;
        if (pixel.classList.contains('pixel-cell')) {
            pixel.style.backgroundColor = colorPicker.value;
        }
    });

    editorGrid.addEventListener('click', (e) => {
        const pixel = e.target;
        if (pixel.classList.contains('pixel-cell')) {
            pixel.style.backgroundColor = colorPicker.value;
        }
    });

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            applyFilter(btn.dataset.filter);
        });
    });

    // Adjust editor grid size
    function adjustEditorSize() {
        const modalContent = document.querySelector('.modal-content');
        const availableHeight = window.innerHeight * 0.7; // 70% of viewport height
        const availableWidth = modalContent.clientWidth * 0.8; // 80% of modal width
        const size = Math.min(availableHeight, availableWidth);
        
        editorGrid.style.width = `${size}px`;
        editorGrid.style.height = `${size}px`;
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (editorModal.style.display === 'block') {
            adjustEditorSize();
        }
    });

    // Close modal when clicking outside
    editorModal.addEventListener('click', (e) => {
        if (e.target === editorModal) {
            editorModal.style.display = 'none';
        }
    });

    // Initially hide buttons and containers
    buttonContainer.className = 'button-container';
    generateBtn.disabled = true;
    editBtn.disabled = true;
    saveBtn.disabled = true;
    pixelArtContainer.style.display = 'none';

    // Check if we're in an active session
    if (window.location.pathname.includes('generator.html')) {
        const savedImages = JSON.parse(sessionStorage.getItem('pixelArtHistory') || '[]');
        if (savedImages.length > 0) {
            // Load the most recent image
            const lastImage = savedImages[0];
            originalImage = new Image();
            originalImage.onload = () => {
                originalPreview.src = lastImage.dataUrl;
                pixelArtCanvas.width = PIXEL_SIZE;
                pixelArtCanvas.height = PIXEL_SIZE;
                pixelArtCanvas.style.width = '300px';
                pixelArtCanvas.style.height = '300px';
                pixelArtCanvas.style.imageRendering = 'pixelated';
                
                const ctx = pixelArtCanvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    originalPixelArt = ctx.getImageData(0, 0, PIXEL_SIZE, PIXEL_SIZE);
                    
                    // Show the containers and enable buttons
                    document.getElementById('uploadContainer').style.display = 'none';
                    pixelArtContainer.style.display = 'block';
                    buttonContainer.className = 'button-container show-edit show-save';
                    editBtn.disabled = false;
                    saveBtn.disabled = false;
                };
                img.src = lastImage.dataUrl;
            };
            originalImage.src = lastImage.dataUrl;
        }
    }
}); 