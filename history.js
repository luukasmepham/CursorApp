document.addEventListener('DOMContentLoaded', () => {
    const historyContainer = document.getElementById('historyContainer');

    function loadHistory() {
        const savedImages = JSON.parse(sessionStorage.getItem('pixelArtHistory') || '[]');
        
        if (savedImages.length === 0) {
            historyContainer.innerHTML = '<p>No pixel art generated in this session yet. Go to the generator to create some!</p>';
            return;
        }

        historyContainer.innerHTML = '';
        savedImages.forEach((imageData, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const imgContainer = document.createElement('div');
            imgContainer.className = 'history-image-container';

            const img = document.createElement('img');
            img.src = imageData.dataUrl;
            img.alt = 'Generated Pixel Art';
            imgContainer.appendChild(img);

            const timestamp = new Date(imageData.timestamp);
            const dateStr = timestamp.toLocaleDateString();
            const timeStr = timestamp.toLocaleTimeString();
            
            const dateInfo = document.createElement('p');
            dateInfo.textContent = `Generated on ${dateStr} at ${timeStr}`;

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'history-buttons';

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn';
            downloadBtn.textContent = 'Download';
            downloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = imageData.filename;
                link.href = imageData.dataUrl;
                link.click();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this image?')) {
                    const savedImages = JSON.parse(sessionStorage.getItem('pixelArtHistory') || '[]');
                    savedImages.splice(index, 1);
                    sessionStorage.setItem('pixelArtHistory', JSON.stringify(savedImages));
                    loadHistory(); // Refresh the history display
                }
            });

            buttonContainer.appendChild(downloadBtn);
            buttonContainer.appendChild(deleteBtn);

            historyItem.appendChild(imgContainer);
            historyItem.appendChild(dateInfo);
            historyItem.appendChild(buttonContainer);
            historyContainer.appendChild(historyItem);
        });
    }

    loadHistory();
}); 