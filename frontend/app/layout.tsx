import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from '../components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HostelIQ — Smart Room Allocation',
  description:
    'A modern, comprehensive hostel room allocation and management platform for students and administrators.',
  keywords: ['hostel', 'room allocation', 'student accommodation', 'campus housing'],
  openGraph: {
    title: 'HostelIQ — Smart Room Allocation',
    description: 'Smart hostel room allocation for modern campuses',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a0f] text-white antialiased`}>
        <AuthProvider>
          <Toaster>
            {children}
          </Toaster>
        </AuthProvider>
      </body>
    </html>
  );
}
