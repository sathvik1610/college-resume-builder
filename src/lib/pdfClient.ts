import regular from '@/fonts/cmunrm.woff?url'
import bold from '@/fonts/cmunbx.woff?url'
import italic from '@/fonts/cmunti.woff?url'
import boldItalic from '@/fonts/cmunbi.woff?url'
import type { Resume } from './model'
import { logoSrc } from './render'
import { download, slug } from './exporters'

// The PDF engine is large, so it loads only when someone asks for a PDF.
export async function downloadPdf(r: Resume, userLogo?: string) {
  const { makePdfBlob } = await import('./pdf')
  const abs = (u: string) => (u.startsWith('data:') ? u : new URL(u, location.href).href)
  const logo = r.settings.showLogo ? abs(logoSrc(userLogo)) : undefined
  const blob = await makePdfBlob(r, logo, {
    regular: abs(regular), bold: abs(bold), italic: abs(italic), boldItalic: abs(boldItalic),
  })
  download(`${slug(r.basics.name)}_Resume.pdf`, blob, 'application/pdf')
}
