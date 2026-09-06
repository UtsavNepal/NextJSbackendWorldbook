import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './docs.css';

export const metadata: Metadata = {
  title: 'Worldbook API Docs',
  description: 'Swagger UI for the Worldbook backend',
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return children;
}
