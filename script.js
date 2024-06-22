document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const pdfList = document.getElementById('pdfList');
    const pdfPreview = document.getElementById('pdfPreview');
    const mergeButton = document.getElementById('mergeButton');
    const resetButton = document.getElementById('resetButton');
    const exitButton = document.getElementById('exitButton');
    const decreaseSize = document.getElementById('decreaseSize');
    const increaseSize = document.getElementById('increaseSize');
    const sizeDisplay = document.getElementById('sizeDisplay');
    
    let pdfFiles = [];
    let sizeKB = 100;
    
    fileInput.addEventListener('change', handleFiles);
    mergeButton.addEventListener('click', mergePDFs);
    resetButton.addEventListener('click', reset);
    exitButton.addEventListener('click', () => window.close());
    decreaseSize.addEventListener('click', () => adjustSize(-100));
    increaseSize.addEventListener('click', () => adjustSize(100));
    
    const sortable = new Sortable(pdfList, {
        animation: 150,
        onEnd: () => {
            const reorderedFiles = [];
            const items = pdfList.querySelectorAll('.pdf-item');
            items.forEach(item => {
                const index = item.getAttribute('data-index');
                reorderedFiles.push(pdfFiles[index]);
            });
            pdfFiles = reorderedFiles;
        }
    });

    function handleFiles(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                pdfFiles.push(file);
                addToList(file);
            }
        });
    }
    
    function addToList(file) {
        const index = pdfFiles.indexOf(file);
        const pdfItem = document.createElement('div');
        pdfItem.className = 'pdf-item';
        pdfItem.setAttribute('data-index', index);
        pdfItem.innerHTML = `
            <span>${file.name}</span>
            <div>
                <button class="btn btn-outline-info btn-sm preview-btn">Preview</button>
                <button class="btn btn-outline-danger btn-sm remove-btn">Remove</button>
            </div>
        `;
        pdfList.appendChild(pdfItem);
        
        const previewButton = pdfItem.querySelector('.preview-btn');
        const removeButton = pdfItem.querySelector('.remove-btn');
        
        previewButton.addEventListener('click', () => previewPDF(file));
        removeButton.addEventListener('click', () => removePDF(file, pdfItem));
    }
    
    function previewPDF(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const pdfData = new Uint8Array(e.target.result);
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            loadingTask.promise.then(pdf => {
                pdf.getPage(1).then(page => {
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    page.render({ canvasContext: context, viewport: viewport }).promise.then(() => {
                        pdfPreview.innerHTML = '';
                        pdfPreview.appendChild(canvas);
                    });
                });
            });
        };
        reader.readAsArrayBuffer(file);
    }
    
    function removePDF(file, pdfItem) {
        const index = pdfFiles.indexOf(file);
        if (index > -1) {
            pdfFiles.splice(index, 1);
            pdfItem.remove();
            updateDataIndices();
        }
    }
    
    function updateDataIndices() {
        const items = pdfList.querySelectorAll('.pdf-item');
        items.forEach((item, index) => {
            item.setAttribute('data-index', index);
        });
    }

    async function mergePDFs() {
        if (pdfFiles.length < 2) {
            alert('Please select at least two PDF files to merge.');
            return;
        }
        
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        for (const pdfFile of pdfFiles) {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `merged_${Date.now()}.pdf`;
        link.click();
    }
    
    function reset() {
        pdfFiles = [];
        fileInput.value = '';
        pdfList.innerHTML = '';
        pdfPreview.innerHTML = '';
    }
    
    function adjustSize(delta) {
        sizeKB = Math.max(100, sizeKB + delta);
        sizeDisplay.textContent = `${sizeKB} KB`;
    }
});
