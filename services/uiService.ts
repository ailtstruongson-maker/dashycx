
// A module-level promise to ensure the script is fetched only once.
let html2canvasPromise: Promise<any> | null = null;

const getHtml2canvas = (): Promise<any> => {
    if (!html2canvasPromise) {
        html2canvasPromise = new Promise((resolve, reject) => {
            // Check if the script was somehow loaded already.
            if ((window as any).html2canvas) {
                return resolve((window as any).html2canvas);
            }
            // Create the script tag to load the library from a CDN.
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.async = true;

            script.onload = () => {
                // The script has loaded, check if the global `html2canvas` function exists.
                if ((window as any).html2canvas) {
                    resolve((window as any).html2canvas);
                } else {
                    reject(new Error('html2canvas script loaded but library not found on window object.'));
                }
            };

            script.onerror = (error) => {
                // If loading fails, reset the promise to allow for a retry on the next call.
                html2canvasPromise = null;
                reject(new Error(`Failed to load html2canvas script: ${error}`));
            };

            document.head.appendChild(script);
        });
    }
    return html2canvasPromise;
};

const waitForImages = (element: HTMLElement): Promise<void[]> => {
    const images = Array.from(element.querySelectorAll('img'));
    const promises = images.map(img => {
        if (img.complete && img.naturalHeight !== 0) {
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            // Also resolve on error to avoid blocking the export process indefinitely.
            img.onerror = () => resolve();
        });
    });
    return Promise.all(promises);
};


export async function exportElementAsImage(element: HTMLElement, filename: string, options: any = {}) {
    const html2canvas = await getHtml2canvas();
    
    const { elementsToHide = [], forceOpenDetails = false, scale = 2, isCompactTable = false, captureAsDisplayed = false, forcedWidth = null } = options;

    elementsToHide.forEach((s: string) => document.querySelectorAll(s).forEach((e: any) => e.style.visibility = 'hidden'));
    document.body.classList.add('is-capturing');

    const clone = element.cloneNode(true) as HTMLElement;

    // ROBUST OVERFLOW FIX: Recursively find and disable any properties that might clip
    // the content during capture (e.g., overflow, max-height). This is crucial for components
    // that use `overflow-hidden` for layout purposes, like achieving rounded corners on tables,
    // which was causing the right border to be cut off during export.
    const elementsWithPotentialOverflow = [clone, ...Array.from(clone.querySelectorAll('*'))];
    elementsWithPotentialOverflow.forEach(el => {
        if (el instanceof HTMLElement) {
            const computedStyle = window.getComputedStyle(el);
            const hasOverflowClass = Array.from(el.classList).some(cls => cls.startsWith('overflow-'));
            const hasMaxHeightClass = Array.from(el.classList).some(cls => cls.startsWith('max-h-'));
            
            // Check computed style as well for inline styles or other CSS rules
            // NOTE: We override with 'visible !important' to ensure content is not clipped.
            if (hasOverflowClass || computedStyle.overflow !== 'visible' || computedStyle.overflowX !== 'visible' || computedStyle.overflowY !== 'visible') {
                el.style.setProperty('overflow', 'visible', 'important');
                el.style.setProperty('overflow-x', 'visible', 'important');
                el.style.setProperty('overflow-y', 'visible', 'important');
            }
             if (hasMaxHeightClass || computedStyle.maxHeight !== 'none') {
                el.style.setProperty('max-height', 'none', 'important');
            }
        }
    });

    // Special styling for exports to fix layout shifts and add requested padding.

    // 1. KPI Cards: Add padding to various elements.
    // a) Add general padding to the bottom of each KPI card.
    const kpiCardElements = clone.querySelectorAll('.kpi-grid-for-export > .chart-card');
    kpiCardElements.forEach(el => {
        if (el instanceof HTMLElement) {
            // The card has p-4 (1rem) by default. We add 5px to the bottom.
            el.style.paddingBottom = 'calc(1rem + 5px)';
        }
    });

    // b) Add specific padding below the auxiliary info in the "Tra Gop" card.
    const traGopAuxElements = clone.querySelectorAll('.chart-card .flex-shrink-0 > .text-xs');
    traGopAuxElements.forEach(el => {
        if (el instanceof HTMLElement) {
            el.style.paddingBottom = '5px';
        }
    });


    // 2. Industry Grid Cards: Add 5px padding below the industry name.
    // This applies when exporting the industry grid or the business overview.
    if (filename.startsWith('ty-trong-nganh-hang') || filename.startsWith('tong-quan-kinh-doanh')) {
        const industryCardTitles = clone.querySelectorAll('.industry-cards-grid .font-bold.truncate.w-full');
        industryCardTitles.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.paddingBottom = '5px';
            }
        });
    }

    // 3. Top Seller List Items: Add 5px padding to various elements to fix alignment issues on export.
    // This applies when exporting the top seller list or the business overview.
    if (filename.startsWith('top-ban-chay') || filename.startsWith('tong-quan-kinh-doanh') || filename.startsWith('phan-tich-nhan-vien-topSellers')) {
        const topSellerElementsToPad = [
            ...clone.querySelectorAll('.flex-grow.min-w-0 > .font-bold.truncate'), // Name
            ...clone.querySelectorAll('.flex-grow.min-w-0 > .text-xs'),           // Metrics container
            ...clone.querySelectorAll('.w-8.text-2xl'),                           // Medal rank
            ...clone.querySelectorAll('.w-8.text-xs.font-bold'),                  // Bot rank
            ...clone.querySelectorAll('.text-right.flex-shrink-0')                // DTQD container
        ];
        
        topSellerElementsToPad.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.paddingBottom = '5px';
            }
        });
    }

    // 4. Warehouse Summary & Summary Table Fix: Add padding and z-index fix for export.
    // This fixes the white streak issue on rowSpan cells (e.g., KHO, NGÀNH HÀNG).
    if (filename.startsWith('bao-cao-kho') || filename.startsWith('chi-tiet-nganh-hang')) {
        const elementsToPad = [
            ...clone.querySelectorAll('.p-5.flex.justify-between.items-center'), // Header container
            ...clone.querySelectorAll('.text-xl.font-bold'), // Header title
            ...clone.querySelectorAll('.text-sm.text-slate-500.mt-1'), // Header subtitle
            ...clone.querySelectorAll('tbody > tr'), // Table rows
            ...clone.querySelectorAll('tfoot') // Table footer
        ];

        elementsToPad.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.paddingBottom = '5px';
            }
        });

        // FIX (REINFORCED): The html2canvas library incorrectly renders the background of sticky headers.
        // We target the first TH of the first TR in THEAD (which corresponds to "KHO" or "NGÀNH HÀNG").
        // This applies to both Standard view (single row) and Comparison view (rowSpan=2).
        const mainHeaderCell = clone.querySelector('thead tr:first-child th:first-child');
        
        if (mainHeaderCell && mainHeaderCell instanceof HTMLElement) {
            // Reset sticky position to relative to prevent layering issues during capture
            mainHeaderCell.style.setProperty('position', 'relative', 'important');
            mainHeaderCell.style.setProperty('z-index', '9999', 'important');

            const isDark = document.documentElement.classList.contains('dark');
            let bgColor = isDark ? '#1f2937' : '#f8fafc'; // Default: slate-800 or slate-50
            
            // For Summary Table (chi-tiet-nganh-hang), force the specific header background
            if (filename.startsWith('chi-tiet-nganh-hang')) {
                bgColor = isDark ? '#1f2937' : '#eef2ff'; // bg-indigo-50 or slate-800
            } else if (filename.startsWith('bao-cao-kho')) {
                bgColor = isDark ? '#1f2937' : '#eef2ff'; // Use a clean background for warehouse report too
            }
            
            mainHeaderCell.style.setProperty('background-color', bgColor, 'important');
            // Ensure no other background layers interfere
            mainHeaderCell.style.setProperty('background-image', 'none', 'important');
        }

        // Target secondary header rows to push them down in stacking context
        const headerRows = clone.querySelectorAll('thead tr');
        if (headerRows.length > 1) {
            const secondHeaderRow = headerRows[1] as HTMLElement;
            secondHeaderRow.style.setProperty('position', 'relative', 'important');
            secondHeaderRow.style.setProperty('z-index', '0', 'important');
        }
    }


    if (forceOpenDetails) {
        const detailsToOpen = [
            ...(clone.tagName.toLowerCase() === 'details' ? [clone as HTMLDetailsElement] : []),
            ...Array.from(clone.querySelectorAll('details'))
        ];
        detailsToOpen.forEach(detail => {
            detail.open = true;
        });
    }
    
     // FIX FOR SCROLLABLE CONTENT (e.g., Performance Modal)
    const scrollableContainers = clone.querySelectorAll('.max-h-96.overflow-y-auto, .max-h-60.overflow-y-auto, [class*="max-h-"][class*="overflow-y-"]');
    scrollableContainers.forEach((container: any) => {
        container.style.maxHeight = 'none';
        container.style.overflowY = 'visible';
    });


    // This container is needed to compute styles and dimensions correctly.
    const captureContainer = document.createElement('div');
    captureContainer.style.position = 'absolute';
    captureContainer.style.left = '-9999px';
    captureContainer.style.top = '0';
    
    if (forcedWidth) {
        captureContainer.style.width = `${forcedWidth}px`;
        captureContainer.style.height = 'auto';
    } else if (captureAsDisplayed) {
        // To capture only the visible area, we must constrain the container
        // to the original element's client dimensions and hide overflow.
        captureContainer.style.width = `${element.clientWidth}px`;
        captureContainer.style.height = `${element.clientHeight}px`;
        captureContainer.style.overflow = 'hidden';
    } else {
        // Use 'fit-content' to make the container intrinsically size itself to its content.
        captureContainer.style.width = 'fit-content';
        captureContainer.style.height = 'auto';
    }
    
    const shouldCompactTable = captureAsDisplayed ? false : isCompactTable;
    if (shouldCompactTable) {
        const tables = clone.querySelectorAll('table');
        tables.forEach(table => {
            table.classList.add('compact-export-table');
        });
    }

    captureContainer.appendChild(clone);
    document.body.appendChild(captureContainer);
    
    // Rerender Lucide icons in the cloned element
    if ((window as any).lucide) {
        (window as any).lucide.createIcons({ root: clone });
    }

    // ROBUST FIX: Address icon rendering issues on KPI Cards during export.
    // This must run *after* lucide.createIcons() has converted <i> tags to <svg>.
    if (clone.querySelector('.kpi-grid-for-export')) {
        const kpiCards = clone.querySelectorAll('.kpi-grid-for-export .chart-card');
        
        kpiCards.forEach(card => {
            if (card instanceof HTMLElement) {
                // Fix 1: The decorative background icon was rendering on top of text.
                // This is often caused by `overflow: hidden` on the parent creating an
                // unexpected stacking context that `html2canvas` misinterprets.
                // By setting overflow to visible on the clone, we allow the existing z-index
                // (z-0 for icon, z-10 for text) to function correctly during capture.
                card.style.overflow = 'visible';
                
                // Fix 2: Ensure the small icon in the header renders correctly.
                // html2canvas fails to compute `currentColor`. We must apply the color directly.
                const functionalIconContainer = card.querySelector<HTMLElement>('.flex-shrink-0');
                if (functionalIconContainer) {
                    const iconSVG = functionalIconContainer.querySelector<SVGElement>('svg');
                    const computedColor = window.getComputedStyle(functionalIconContainer).color;
                    
                    if (iconSVG && computedColor) {
                       // Apply color to the SVG element itself to help with inheritance.
                       iconSVG.setAttribute('stroke', computedColor);
                       
                       // Also apply to all child elements for maximum compatibility.
                       iconSVG.querySelectorAll('line, path, rect, circle, polyline, polygon').forEach((child) => {
                           if (child instanceof SVGElement) {
                               child.setAttribute('stroke', computedColor);
                           }
                       });
                    }
                }
            }
        });
    }
    
    try {
        // --- REVISED WAITING LOGIC ---
        // 1. Wait for fonts to be ready. This is the main solution for text rendering issues.
        await document.fonts.ready;
        
        // 2. Wait for any images inside the clone to finish loading.
        await waitForImages(clone);

        // 3. Wait for the browser's next paint cycle to ensure styles and fonts are applied.
        // Waiting for two frames is a robust way to handle complex rendering updates.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // 4. A final small delay as a fallback for asynchronous scripts like Tailwind's JIT.
        await new Promise(resolve => setTimeout(resolve, 400));
        // --- END OF REVISED LOGIC ---

        const canvas = await html2canvas(clone, {
            scale: scale,
            useCORS: true,
            backgroundColor: (filename.startsWith('bao-cao-kho') || filename.startsWith('chi-tiet-nganh-hang'))
                ? null 
                : (document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc'),
            logging: false,
            letterRendering: true,
            // Let html2canvas determine the capture area based on the element's scroll dimensions
            // unless we are explicitly capturing only the visible part.
            width: captureAsDisplayed ? element.clientWidth : clone.scrollWidth,
            height: captureAsDisplayed ? element.clientHeight : clone.scrollHeight,
        });

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error(`Lỗi khi xuất ảnh: ${filename}`, error);
    } finally {
        document.body.removeChild(captureContainer);
        document.body.classList.remove('is-capturing');
        elementsToHide.forEach((s: string) => document.querySelectorAll(s).forEach((e: any) => e.style.visibility = ''));
    }
}
