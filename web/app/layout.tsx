import './globals.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Warstruck',
  description: 'Prototype Next.js + Mantine client for the Warstruck tactical board game.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
      </body>
    </html>
  );
}
