
/**
 * Service hỗ trợ chụp ảnh các thành phần UI
 */
export async function exportElementAsImage(element: HTMLElement, filename: string) {
  // Kiểm tra nếu thư viện đã tải chưa, nếu chưa thì tải động
  if (!(window as any).html2canvas) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  const canvas = await (window as any).html2canvas(element, {
    scale: 2, // Tăng chất lượng ảnh
    useCORS: true,
    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
    logging: false
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
