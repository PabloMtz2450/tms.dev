import type { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'TMS.dev', description: 'Logistics Operating System' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
