import type { ReactNode } from 'react';
import './globals.css';
import './product.css';

export const metadata = { title: 'TMS XOLUM', description: 'Soluciones que realmente ayudan para transporte y última milla.' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
