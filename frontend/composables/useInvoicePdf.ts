export function useInvoicePdf() {
  async function downloadElementAsPdf(elementId: string, fileName: string) {
    if (!process.client) return

    const target = document.getElementById(elementId)
    if (!target) {
      throw new Error("Invoice target not found")
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")])

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f2f6fb"
    })

    const image = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imageWidth = pageWidth - margin * 2
    const imageHeight = (canvas.height * imageWidth) / canvas.width

    let heightLeft = imageHeight
    let position = margin

    pdf.addImage(image, "PNG", margin, position, imageWidth, imageHeight, undefined, "FAST")
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      position = heightLeft - imageHeight + margin
      pdf.addPage()
      pdf.addImage(image, "PNG", margin, position, imageWidth, imageHeight, undefined, "FAST")
      heightLeft -= pageHeight - margin * 2
    }

    pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`)
  }

  function printPage() {
    if (process.client) {
      window.print()
    }
  }

  return {
    downloadElementAsPdf,
    printPage
  }
}
