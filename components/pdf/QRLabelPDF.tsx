'use client'

import React from 'react'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatExpiry } from '@/lib/qr'

export type QRLayout = 1 | 2 | 4 | 6 | 9

export interface QRLabelData {
  machineName: string
  fileName: string
  qrUniqueId: string
  expiryDate: string | null
  generatedDate: string
  status: 'pass' | 'fail' | 'needs_attention'
  qrDataUrl: string
}

interface QRLabelPDFProps {
  labels: QRLabelData[]
  layout: QRLayout
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 24,
    fontFamily: 'Helvetica',
  },
  sheet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  label: {
    border: '1pt solid #b9bec8',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  titleBlock: {
    width: '100%',
    alignItems: 'center',
  },
  machineName: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'center',
  },
  fileName: {
    color: '#374151',
    textAlign: 'center',
    marginTop: 3,
  },
  qr: {
    objectFit: 'contain',
  },
  metadata: {
    width: '100%',
    borderTop: '0.75pt solid #d8dce3',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: '#4b5563',
  },
  qrId: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
})

const layoutConfig: Record<QRLayout, { columns: number; rows: number; qrSize: number; titleSize: number; fileSize: number; metaSize: number }> = {
  1: { columns: 1, rows: 1, qrSize: 500, titleSize: 20, fileSize: 12, metaSize: 10 },
  2: { columns: 1, rows: 2, qrSize: 280, titleSize: 16, fileSize: 10, metaSize: 8 },
  4: { columns: 2, rows: 2, qrSize: 220, titleSize: 12, fileSize: 8, metaSize: 7 },
  6: { columns: 2, rows: 3, qrSize: 160, titleSize: 11, fileSize: 7, metaSize: 6 },
  9: { columns: 3, rows: 3, qrSize: 110, titleSize: 9, fileSize: 6, metaSize: 5 },
}

function chunkLabels(labels: QRLabelData[], size: number) {
  const chunks: QRLabelData[][] = []
  for (let index = 0; index < labels.length; index += size) {
    chunks.push(labels.slice(index, index + size))
  }
  return chunks
}

export function QRLabelPDF({ labels, layout }: QRLabelPDFProps) {
  const config = layoutConfig[layout]
  const gap = 8
  const usableWidth = 547
  const usableHeight = 790
  const labelWidth = (usableWidth - gap * (config.columns - 1)) / config.columns
  const labelHeight = (usableHeight - gap * (config.rows - 1)) / config.rows
  const pages = chunkLabels(labels, layout)

  return (
    <Document title="QR label sheet" author="Project QR">
      {pages.map((pageLabels, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={[styles.sheet, { gap }]}>
            {pageLabels.map(label => (
              <View key={label.qrUniqueId} style={[styles.label, { width: labelWidth, height: labelHeight }]}>
                <View style={styles.titleBlock}>
                  <Text style={[styles.machineName, { fontSize: config.titleSize }]}>{label.machineName}</Text>
                  <Text style={[styles.fileName, { fontSize: config.fileSize }]}>{label.fileName}</Text>
                </View>

                {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image has no alt prop */}
                <Image src={label.qrDataUrl} style={[styles.qr, { width: config.qrSize, height: config.qrSize }]} />

                <View style={styles.metadata}>
                  <View>
                    <Text style={[styles.metaText, { fontSize: config.metaSize }]}>EXPIRES</Text>
                    <Text style={[styles.qrId, { fontSize: config.metaSize }]}>{formatExpiry(label.expiryDate)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.metaText, { fontSize: config.metaSize }]}>QR ID</Text>
                    <Text style={[styles.qrId, { fontSize: config.metaSize }]}>{label.qrUniqueId}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  )
}
