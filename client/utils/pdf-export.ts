/**
 * Professional PDF Export for Security Reports
 * Includes SentinelHub and Samurai logos
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface VulnerabilitySummary {
  critical: number
  high: number
  medium: number
  low: number
}

interface ScanSession {
  id: string
  timestamp: string
  source: string
  sourceDetails: string
  score: number
  vulnerabilities: VulnerabilitySummary
  engines: string[]
  status: string
  duration: string
  compliance: {
    owasp: number
    nist: number
    iso27001: number
  }
}

interface ExportData {
  generatedAt: string
  summary: {
    totalScans: number
    averageScore: number
    totalVulnerabilities: VulnerabilitySummary
    criticalIssues: number
  }
  scans: ScanSession[]
  intelligence?: any
  filters?: {
    source: string
    dateRange: string
  }
}

export async function generateSecurityReportPDF(data: ExportData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  let yPos = 20

  // ============================================
  // HEADER WITH LOGOS
  // ============================================

  // Add SentinelHub logo (top left)
  try {
    const sentinelLogo = await loadImage('/images/logoBig.png')
    doc.addImage(sentinelLogo, 'PNG', 15, 10, 40, 15)
  } catch (error) {
    console.warn('Could not load SentinelHub logo')
  }

  // Add Samurai logo (top right)
  try {
    const samuraiLogo = await loadImage('/images/s.png')
    doc.addImage(samuraiLogo, 'PNG', pageWidth - 35, 10, 20, 15)
  } catch (error) {
    console.warn('Could not load Samurai logo')
  }

  yPos = 35

  // ============================================
  // TITLE
  // ============================================
  doc.setFontSize(24)
  doc.setTextColor(0, 149, 182) // Cyan color
  doc.text('Security Scan Report', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' })

  yPos += 15

  // ============================================
  // EXECUTIVE SUMMARY BOX
  // ============================================
  doc.setDrawColor(0, 149, 182)
  doc.setLineWidth(0.5)
  doc.rect(15, yPos, pageWidth - 30, 45)

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Executive Summary', 20, yPos + 8)

  doc.setFontSize(10)
  const summaryData = [
    `Total Scans: ${data.summary.totalScans}`,
    `Average Security Score: ${data.summary.averageScore}/100`,
    `Critical Issues: ${data.summary.totalVulnerabilities.critical}`,
    `High Severity: ${data.summary.totalVulnerabilities.high}`,
    `Medium Severity: ${data.summary.totalVulnerabilities.medium}`,
    `Low Severity: ${data.summary.totalVulnerabilities.low}`,
  ]

  let summaryY = yPos + 15
  summaryData.forEach(line => {
    doc.text(line, 20, summaryY)
    summaryY += 6
  })

  yPos += 55

  // ============================================
  // VULNERABILITY BREAKDOWN CHART
  // ============================================
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Vulnerability Breakdown', 15, yPos)
  yPos += 10

  const total = Object.values(data.summary.totalVulnerabilities).reduce((a, b) => a + b, 0)
  const vulnerabilityData = [
    ['Severity', 'Count', 'Percentage'],
    ['Critical', data.summary.totalVulnerabilities.critical.toString(), `${total > 0 ? ((data.summary.totalVulnerabilities.critical / total) * 100).toFixed(1) : 0}%`],
    ['High', data.summary.totalVulnerabilities.high.toString(), `${total > 0 ? ((data.summary.totalVulnerabilities.high / total) * 100).toFixed(1) : 0}%`],
    ['Medium', data.summary.totalVulnerabilities.medium.toString(), `${total > 0 ? ((data.summary.totalVulnerabilities.medium / total) * 100).toFixed(1) : 0}%`],
    ['Low', data.summary.totalVulnerabilities.low.toString(), `${total > 0 ? ((data.summary.totalVulnerabilities.low / total) * 100).toFixed(1) : 0}%`],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [vulnerabilityData[0]],
    body: vulnerabilityData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [0, 149, 182] },
    styles: { fontSize: 10 },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const severity = data.cell.text[0]
        let color = [100, 100, 100]
        if (severity === 'Critical') color = [220, 53, 69]
        else if (severity === 'High') color = [255, 133, 27]
        else if (severity === 'Medium') color = [255, 193, 7]
        else if (severity === 'Low') color = [13, 110, 253]

        doc.setFillColor(color[0], color[1], color[2])
        doc.rect(data.cell.x, data.cell.y, 3, data.cell.height, 'F')
      }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // ============================================
  // SCAN HISTORY TABLE
  // ============================================
  if (yPos > pageHeight - 60) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.text('Scan History', 15, yPos)
  yPos += 10

  const scanTableData = data.scans.slice(0, 10).map(scan => [
    new Date(scan.timestamp).toLocaleDateString(),
    scan.sourceDetails.substring(0, 30),
    `${scan.score}/100`,
    `${scan.vulnerabilities.critical}C ${scan.vulnerabilities.high}H`,
    scan.status
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Source', 'Score', 'Issues', 'Status']],
    body: scanTableData,
    theme: 'striped',
    headStyles: { fillColor: [0, 149, 182] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // ============================================
  // SECURITY INTELLIGENCE (if available)
  // ============================================
  if (data.intelligence && yPos < pageHeight - 40) {
    doc.setFontSize(14)
    doc.text('Security Intelligence', 15, yPos)
    yPos += 10

    const intelligenceData = [
      ['Metric', 'Count'],
      ['Data Breaches', (data.intelligence.breaches?.length || 0).toString()],
      ['CVE Matches', (data.intelligence.cves?.length || 0).toString()],
      ['Threat Indicators', (data.intelligence.threats?.length || 0).toString()],
      ['Recommendations', (data.intelligence.recommendations?.length || 0).toString()],
    ]

    autoTable(doc, {
      startY: yPos,
      head: [intelligenceData[0]],
      body: intelligenceData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [255, 133, 27] },
      styles: { fontSize: 10 }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // ============================================
  // FOOTER WITH LOGOS AND COPYRIGHT
  // ============================================
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 15

    // Footer line
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5)

    // Text
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Powered by SentinelHub', 15, footerY)
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' })
    doc.text(`© ${new Date().getFullYear()} SentinelHub`, pageWidth - 15, footerY, { align: 'right' })

    // Small samurai logo in footer
    try {
      doc.addImage('/images/s.png', 'PNG', pageWidth - 25, footerY - 8, 8, 6)
    } catch (error) {
      // Ignore if logo not available
    }
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i, totalPages)
  }

  // ============================================
  // SAVE PDF
  // ============================================
  const filename = `SentinelHub-Security-Report-${Date.now()}.pdf`
  doc.save(filename)

  return { success: true, filename }
}

// Helper function to load images
async function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = reject
    img.src = src
  })
}
