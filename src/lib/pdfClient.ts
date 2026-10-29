import regular from '@/fonts/cmunrm.ttf?url'
import bold from '@/fonts/cmunbx.ttf?url'
import italic from '@/fonts/cmunti.ttf?url'
import boldItalic from '@/fonts/cmunbi.ttf?url'
import type { Resume } from './model'
import { download, slug } from './exporters'

// The PDF engine is large, so it loads only when someone asks for a PDF.
export async function downloadPdf(r: Resume, userLogo?: string) {
  const { makePdfBlob } = await import('./pdf')
  const abs = (u: string) => (u.startsWith('data:') ? u : new URL(u, location.href).href)
  const blob = await makePdfBlob(r, userLogo, {
    regular: abs(regular), bold: abs(bold), italic: abs(italic), boldItalic: abs(boldItalic),
  })
  download(`${slug(r.basics.name)}_Resume.pdf`, blob, 'application/pdf')
}
