import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 5;

    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - (margin * 2)) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      const totalPages = Math.ceil(imgHeight / (pageHeight - (margin * 2)));

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const sourceY = (imgHeight / totalPages) * i;
        const sourceHeight = Math.min(imgHeight / totalPages, imgHeight - sourceY);
        const targetHeight = (sourceHeight * imgWidth) / canvas.width;

        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin,
          imgWidth,
          targetHeight,
          '',
          'FAST'
        );
      }
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
