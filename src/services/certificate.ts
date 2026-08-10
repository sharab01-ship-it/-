import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export interface CertificateData {
  studentName: string;
  certificateNumber: string;
  issueDate: string;
  completionPercentage: number;
  programName: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<void> {
  const qrData = JSON.stringify({
    certNumber: data.certificateNumber,
    student: data.studentName,
    date: data.issueDate,
    program: data.programName,
  });

  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: { dark: '#1a7a4c', light: '#ffffff' },
  });

  const formattedDate = new Date(data.issueDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div dir="rtl" style="
      width: 1000px;
      height: 700px;
      background: linear-gradient(135deg, #fefcf7 0%, #f5f1e8 100%);
      padding: 50px;
      font-family: 'Cairo', 'Amiri', sans-serif;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    ">
      <!-- Decorative border -->
      <div style="
        position: absolute;
        top: 20px; left: 20px; right: 20px; bottom: 20px;
        border: 3px solid #1a7a4c;
        border-radius: 20px;
        pointer-events: none;
      "></div>
      <div style="
        position: absolute;
        top: 30px; left: 30px; right: 30px; bottom: 30px;
        border: 1px solid #d4a017;
        border-radius: 16px;
        pointer-events: none;
      "></div>

      <!-- Corner decorations -->
      <div style="position: absolute; top: 40px; right: 40px; width: 60px; height: 60px; border-top: 4px solid #d4a017; border-right: 4px solid #d4a017; border-radius: 0 12px 0 0;"></div>
      <div style="position: absolute; top: 40px; left: 40px; width: 60px; height: 60px; border-top: 4px solid #d4a017; border-left: 4px solid #d4a017; border-radius: 12px 0 0 0;"></div>
      <div style="position: absolute; bottom: 40px; right: 40px; width: 60px; height: 60px; border-bottom: 4px solid #d4a017; border-right: 4px solid #d4a017; border-radius: 0 0 12px 0;"></div>
      <div style="position: absolute; bottom: 40px; left: 40px; width: 60px; height: 60px; border-bottom: 4px solid #d4a017; border-left: 4px solid #d4a017; border-radius: 0 0 0 12px;"></div>

      <!-- Logo area -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: #1a7a4c;
          border-radius: 20px;
          color: white;
          font-size: 40px;
          font-weight: bold;
          font-family: 'Amiri', serif;
        ">ز</div>
      </div>

      <!-- Title -->
      <h1 style="
        text-align: center;
        font-size: 42px;
        color: #1a7a4c;
        font-weight: 800;
        margin: 0 0 10px 0;
        font-family: 'Cairo', sans-serif;
      ">شهادة إتمام</h1>

      <p style="
        text-align: center;
        font-size: 22px;
        color: #757575;
        margin: 0 0 40px 0;
        font-family: 'Cairo', sans-serif;
      ">برنامج ${data.programName}</p>

      <!-- Student name -->
      <p style="
        text-align: center;
        font-size: 20px;
        color: #424242;
        margin: 0 0 10px 0;
        font-family: 'Cairo', sans-serif;
      ">تشهد المنصة بأن الطالب/ة</p>

      <p style="
        text-align: center;
        font-size: 36px;
        color: #1a7a4c;
        font-weight: 700;
        margin: 0 0 30px 0;
        font-family: 'Cairo', sans-serif;
        padding: 0 40px;
        border-bottom: 2px solid #d4a017;
        display: inline-block;
        width: auto;
      ">${data.studentName}</p>

      <!-- Completion text -->
      <p style="
        text-align: center;
        font-size: 20px;
        color: #424242;
        margin: 0 0 30px 0;
        line-height: 1.8;
        font-family: 'Cairo', sans-serif;
      ">
        قد أتم بنجاح برنامج حفظ الأحاديث النبوية<br/>
        بنسبة إنجاز قدرها <span style="font-weight: 700; color: #1a7a4c; font-size: 24px;">${data.completionPercentage}%</span>
      </p>

      <!-- Bottom section: date and QR -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 40px;
        padding: 0 40px;
      ">
        <div style="text-align: right;">
          <p style="font-size: 16px; color: #757575; margin: 0 0 5px 0; font-family: 'Cairo', sans-serif;">تاريخ الإصدار</p>
          <p style="font-size: 18px; color: #424242; font-weight: 600; margin: 0; font-family: 'Cairo', sans-serif;">${formattedDate}</p>
          <p style="font-size: 14px; color: #9e9e9e; margin: 10px 0 0 0; font-family: 'Cairo', sans-serif;">رقم الشهادة: ${data.certificateNumber}</p>
        </div>

        <div style="text-align: center;">
          <img src="${qrDataUrl}" style="width: 100px; height: 100px;" />
          <p style="font-size: 12px; color: #9e9e9e; margin: 5px 0 0 0; font-family: 'Cairo', sans-serif;">رمز التحقق</p>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const element = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#fefcf7',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgRatio = canvas.width / canvas.height;
    const targetWidth = pdfWidth - 10;
    const targetHeight = targetWidth / imgRatio;

    pdf.addImage(imgData, 'PNG', 5, 5, targetWidth, Math.min(targetHeight, pdfHeight - 10));
    pdf.save(`شهادة_${data.studentName}_${data.certificateNumber}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
