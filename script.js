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
    const filterControls = document.getElementById('filterControls');
    const gifIndicator = document.getElementById('gifIndicator');
    const pixelDensitySlider = document.getElementById('pixelDensitySlider');
    const densityValue = document.getElementById('densityValue');
    
    let currentPixelSize = 256; // Default to 256x256
    let originalImage = null;
    let isDrawing = false;
    let originalPixelArt = null;
    let isGif = false;
    let gifFrames = [];
    let currentFrame = 0;
    let animationInterval = null;
    let originalGifFrames = null;
    let fullResolutionGifFrames = null; // Store full resolution GIF frames
    let originalGifDimensions = { width: 0, height: 0 }; // Store original GIF dimensions

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
        loadingCanvas.width = currentPixelSize * 8; // Larger size for visibility
        loadingCanvas.height = currentPixelSize * 8;
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
            
            for (let y = 0; y < currentPixelSize; y++) {
                for (let x = 0; x < currentPixelSize; x++) {
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

    // Update pixel density display
    function updateDensityDisplay() {
        densityValue.textContent = `${currentPixelSize}x${currentPixelSize}`;
    }
    
    // Function to resize pixel art
    function resizePixelArt(newSize) {
        if (isGif) {
            // If scaling up and we have full resolution frames, use those
            if (newSize > currentPixelSize && fullResolutionGifFrames) {
                // Resize from full resolution frames
                const resizedFrames = fullResolutionGifFrames.map(frame => {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = newSize;
                    tempCanvas.height = newSize;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.imageSmoothingEnabled = false;
                    
                    // Create an intermediate canvas with the original frame
                    const frameCanvas = document.createElement('canvas');
                    frameCanvas.width = originalGifDimensions.width;
                    frameCanvas.height = originalGifDimensions.height;
                    const frameCtx = frameCanvas.getContext('2d');
                    frameCtx.putImageData(frame.originalData, 0, 0);
                    
                    // Draw resized frame
                    tempCtx.drawImage(frameCanvas, 0, 0, newSize, newSize);
                    
                    // Apply color quantization
                    const imageData = tempCtx.getImageData(0, 0, newSize, newSize);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.round(data[i] / 51) * 51;
                        data[i + 1] = Math.round(data[i + 1] / 51) * 51;
                        data[i + 2] = Math.round(data[i + 2] / 51) * 51;
                    }
                    
                    return {
                        data: imageData,
                        delay: frame.delay
                    };
                });
                
                // Update canvas size and frames
                pixelArtCanvas.width = newSize;
                pixelArtCanvas.height = newSize;
                gifFrames = resizedFrames;
                
            } else {
                // Regular resize for scaling down
                const resizedFrames = gifFrames.map(frame => {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = newSize;
                    tempCanvas.height = newSize;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.imageSmoothingEnabled = false;
                    
                    // Create an intermediate canvas with the original frame
                    const frameCanvas = document.createElement('canvas');
                    frameCanvas.width = frame.data.width;
                    frameCanvas.height = frame.data.height;
                    const frameCtx = frameCanvas.getContext('2d');
                    frameCtx.putImageData(frame.data, 0, 0);
                    
                    // Draw resized frame
                    tempCtx.drawImage(frameCanvas, 0, 0, newSize, newSize);
                    
                    // Apply color quantization
                    const imageData = tempCtx.getImageData(0, 0, newSize, newSize);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = Math.round(data[i] / 51) * 51;
                        data[i + 1] = Math.round(data[i + 1] / 51) * 51;
                        data[i + 2] = Math.round(data[i + 2] / 51) * 51;
                    }
                    
                    return {
                        data: imageData,
                        delay: frame.delay
                    };
                });
                
                // Update canvas size and frames
                pixelArtCanvas.width = newSize;
                pixelArtCanvas.height = newSize;
                gifFrames = resizedFrames;
            }
            
            // Restart animation
            animateGif();
            
        } else if (originalImage) {
            // Resize static image
            pixelArtCanvas.width = newSize;
            pixelArtCanvas.height = newSize;
            
            const ctx = pixelArtCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, newSize, newSize);
            ctx.drawImage(originalImage, 0, 0, newSize, newSize);
            
            // Apply color quantization
            const imageData = ctx.getImageData(0, 0, newSize, newSize);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.round(data[i] / 51) * 51;
                data[i + 1] = Math.round(data[i + 1] / 51) * 51;
                data[i + 2] = Math.round(data[i + 2] / 51) * 51;
            }
            
            ctx.putImageData(imageData, 0, 0);
            originalPixelArt = ctx.getImageData(0, 0, newSize, newSize);
            
            if (editorModal.style.display === 'block') {
                createEditorGrid();
            }
        }
    }
    
    // Pixel density slider event listener
    pixelDensitySlider.addEventListener('input', () => {
        currentPixelSize = parseInt(pixelDensitySlider.value);
        updateDensityDisplay();
        resizePixelArt(currentPixelSize);
    });

    // Function to process GIF frames
    async function processGifFrames(gifBlob, targetSize = null) {
        const frames = [];
        const gifReader = new GifReader(new Uint8Array(await gifBlob.arrayBuffer()));
        
        // Store original dimensions
        originalGifDimensions.width = gifReader.width;
        originalGifDimensions.height = gifReader.height;
        
        // Use target size or original size if not specified
        const outputSize = targetSize || Math.min(256, Math.max(gifReader.width, gifReader.height));
        
        for (let i = 0; i < gifReader.numFrames(); i++) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = outputSize;
            frameCanvas.height = outputSize;
            const frameCtx = frameCanvas.getContext('2d');
            
            // Create temporary canvas for full-size frame
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = gifReader.width;
            tempCanvas.height = gifReader.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Get frame data
            const frameData = gifReader.frameInfo(i);
            const pixels = new Uint8ClampedArray(gifReader.width * gifReader.height * 4);
            gifReader.decodeAndBlitFrameRGBA(i, pixels);
            
            // Draw frame to temporary canvas
            const imageData = new ImageData(pixels, gifReader.width, gifReader.height);
            tempCtx.putImageData(imageData, 0, 0);
            
            // Scale down to target size
            frameCtx.imageSmoothingEnabled = false;
            frameCtx.drawImage(tempCanvas, 0, 0, outputSize, outputSize);
            
            // Apply color quantization
            const frameImageData = frameCtx.getImageData(0, 0, outputSize, outputSize);
            const data = frameImageData.data;
            
            for (let j = 0; j < data.length; j += 4) {
                data[j] = Math.round(data[j] / 51) * 51;
                data[j + 1] = Math.round(data[j + 1] / 51) * 51;
                data[j + 2] = Math.round(data[j + 2] / 51) * 51;
            }
            
            frameCtx.putImageData(frameImageData, 0, 0);
            frames.push({
                data: frameCtx.getImageData(0, 0, outputSize, outputSize),
                delay: frameData.delay * 10,
                originalData: targetSize ? null : tempCtx.getImageData(0, 0, gifReader.width, gifReader.height)
            });
        }
        
        return frames;
    }
    
    // Function to animate GIF frames
    function animateGif() {
        if (animationInterval) {
            clearInterval(animationInterval);
        }
        
        const ctx = pixelArtCanvas.getContext('2d');
        currentFrame = 0;
        
        animationInterval = setInterval(() => {
            ctx.putImageData(gifFrames[currentFrame].data, 0, 0);
            currentFrame = (currentFrame + 1) % gifFrames.length;
        }, gifFrames[currentFrame].delay || 100);
    }

    // Modified image upload handler
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const animationInterval = showLoading();
        isGif = file.type === 'image/gif';
        
        if (isGif) {
            gifIndicator.style.display = 'block';
            try {
                // Load GIF.js library dynamically
                if (!window.GifReader) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/omggif@1.0.10/omggif.min.js';
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }
                
                // Process and store full resolution frames
                fullResolutionGifFrames = await processGifFrames(file);
                // Process frames at current size
                gifFrames = await processGifFrames(file, currentPixelSize);
                
                // Store original frames for filter resets
                originalGifFrames = gifFrames.map(frame => ({
                    data: new ImageData(
                        new Uint8ClampedArray(frame.data.data),
                        frame.data.width,
                        frame.data.height
                    ),
                    delay: frame.delay
                }));
                
                // Display first frame as preview
                originalPreview.src = URL.createObjectURL(file);
                pixelArtContainer.style.display = 'block';
                
                // Set up canvas with current pixel size
                pixelArtCanvas.width = currentPixelSize;
                pixelArtCanvas.height = currentPixelSize;
                
                // Calculate display size (max 300px while maintaining aspect ratio)
                const maxDisplaySize = 300;
                const displaySize = Math.min(maxDisplaySize, currentPixelSize);
                pixelArtCanvas.style.width = `${displaySize}px`;
                pixelArtCanvas.style.height = `${displaySize}px`;
                
                // Start animation
                animateGif();
                
                // Update UI for GIF mode
                document.getElementById('uploadContainer').style.display = 'none';
                buttonContainer.className = 'button-container show-save';
                editBtn.style.display = 'none';
                generateBtn.style.display = 'none';
                filterControls.style.display = 'block';
                saveBtn.disabled = false;
                
            } catch (error) {
                console.error('Error processing GIF:', error);
                alert('Error processing GIF. Please try another file.');
                gifIndicator.style.display = 'none';
            }
        } else {
            // Handle static image
            gifIndicator.style.display = 'none';
            filterControls.style.display = 'none';
            editBtn.style.display = 'block';
            generateBtn.style.display = 'block';
            
            const reader = new FileReader();
            reader.onload = (event) => {
                originalImage = new Image();
                originalImage.onload = () => {
                    // Show original preview
                    originalPreview.src = event.target.result;
                    pixelArtContainer.style.display = 'block';
                    
                    // Set canvas to current pixel size
                    pixelArtCanvas.width = currentPixelSize;
                    pixelArtCanvas.height = currentPixelSize;
                    
                    // Calculate display size (max 300px while maintaining aspect ratio)
                    const maxDisplaySize = 300;
                    const displaySize = Math.min(maxDisplaySize, currentPixelSize);
                    pixelArtCanvas.style.width = `${displaySize}px`;
                    pixelArtCanvas.style.height = `${displaySize}px`;

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
        }
        
        hideLoading(animationInterval);
    });

    // Modified filter application for GIF support
    function applyFilter(filterName, permanent = false) {
        if (isGif) {
            const filter = filters[filterName];
            
            // For normal filter, restore original frames
            if (filterName === 'normal' && originalGifFrames) {
                gifFrames = originalGifFrames.map(frame => ({
                    data: new ImageData(
                        new Uint8ClampedArray(frame.data.data),
                        frame.data.width,
                        frame.data.height
                    ),
                    delay: frame.delay
                }));
            } else {
                // Apply filter to all frames
                gifFrames = gifFrames.map(frame => {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = currentPixelSize;
                    tempCanvas.height = currentPixelSize;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    tempCtx.putImageData(frame.data, 0, 0);
                    const imageData = tempCtx.getImageData(0, 0, currentPixelSize, currentPixelSize);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const [r, g, b] = filter(data[i], data[i + 1], data[i + 2]);
                        data[i] = Math.round(r / 51) * 51;
                        data[i + 1] = Math.round(g / 51) * 51;
                        data[i + 2] = Math.round(b / 51) * 51;
                    }
                    
                    return {
                        data: imageData,
                        delay: frame.delay
                    };
                });
            }
            
            // Restart animation with filtered frames
            animateGif();
        } else {
            const ctx = pixelArtCanvas.getContext('2d');
            
            // If not permanent, start from the original state
            if (!permanent && originalPixelArt) {
                ctx.putImageData(originalPixelArt, 0, 0);
            }
            
            const imageData = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b] = filters[filterName](data[i], data[i + 1], data[i + 2]);
                data[i] = Math.round(r / 51) * 51;     // Quantize to 8-bit
                data[i + 1] = Math.round(g / 51) * 51;
                data[i + 2] = Math.round(b / 51) * 51;
            }

            ctx.putImageData(imageData, 0, 0);
            
            // If this is a permanent change, update the original state
            if (permanent) {
                originalPixelArt = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
            }
            
            createEditorGrid(); // Update the editor grid
        }
    }

    // Function to convert image to pixel art
    async function convertToPixelArt() {
        if (!originalImage) return;

        const animationInterval = showLoading();
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const ctx = pixelArtCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Set canvas size to current pixel size
        pixelArtCanvas.width = currentPixelSize;
        pixelArtCanvas.height = currentPixelSize;
        
        // Calculate display size (max 300px while maintaining aspect ratio)
        const maxDisplaySize = 300;
        const displaySize = Math.min(maxDisplaySize, currentPixelSize);
        pixelArtCanvas.style.width = `${displaySize}px`;
        pixelArtCanvas.style.height = `${displaySize}px`;
        
        ctx.clearRect(0, 0, currentPixelSize, currentPixelSize);
        ctx.drawImage(originalImage, 0, 0, currentPixelSize, currentPixelSize);
        
        applyFilter('normal', true);
        
        originalPixelArt = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
        
        hideLoading(animationInterval);
        
        buttonContainer.className = 'button-container show-edit show-save';
        generateBtn.style.display = 'none';
        editBtn.disabled = false;
        saveBtn.disabled = false;
    }

    // Function to create the editor grid
    function createEditorGrid() {
        editorGrid.innerHTML = '';
        editorGrid.style.gridTemplateColumns = `repeat(${currentPixelSize}, 1fr)`;
        
        const ctx = pixelArtCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
        const data = imageData.data;

        for (let y = 0; y < currentPixelSize; y++) {
            for (let x = 0; x < currentPixelSize; x++) {
                const index = (y * currentPixelSize + x) * 4;
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
        const imageData = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
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

    // Modified save function for GIF support
    function savePixelArt(autoSave = false) {
        if (!pixelArtCanvas) return;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const customName = filenameInput.value.trim();
        const filename = customName ? `${customName}.${isGif ? 'gif' : 'png'}` : `pixel-art-${timestamp}.${isGif ? 'gif' : 'png'}`;
        
        if (isGif) {
            // Create GIF encoder
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: currentPixelSize,
                height: currentPixelSize,
                workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
            });
            
            // Add frames to encoder
            gifFrames.forEach(frame => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = currentPixelSize;
                tempCanvas.height = currentPixelSize;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(frame.data, 0, 0);
                
                gif.addFrame(tempCanvas, {delay: frame.delay});
            });
            
            // Render GIF
            gif.on('finished', blob => {
                if (autoSave) {
                    const imageData = {
                        filename: filename,
                        timestamp: new Date().toISOString(),
                        dataUrl: URL.createObjectURL(blob),
                        isGif: true
                    };
                    
                    let savedImages = JSON.parse(sessionStorage.getItem('pixelArtHistory') || '[]');
                    savedImages.unshift(imageData);
                    
                    if (savedImages.length > 50) {
                        savedImages = savedImages.slice(0, 50);
                    }
                    
                    sessionStorage.setItem('pixelArtHistory', JSON.stringify(savedImages));
                } else {
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }
            });
            
            gif.render();
        } else {
            const saveCanvas = document.createElement('canvas');
            saveCanvas.width = currentPixelSize;
            saveCanvas.height = currentPixelSize;
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
        originalPixelArt = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
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
                pixelArtCanvas.width = currentPixelSize;
                pixelArtCanvas.height = currentPixelSize;
                pixelArtCanvas.style.width = '300px';
                pixelArtCanvas.style.height = '300px';
                pixelArtCanvas.style.imageRendering = 'pixelated';
                
                const ctx = pixelArtCanvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    originalPixelArt = ctx.getImageData(0, 0, currentPixelSize, currentPixelSize);
                    
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

    // Initialize pixel density display
    updateDensityDisplay();
}); 