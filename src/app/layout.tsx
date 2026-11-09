import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseTeams — Real-Time Collaboration Workspace',
  description: 'Clean-room Next.js 14 + Socket.io + MongoDB + WebRTC/LiveKit Workspace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden antialiased select-none">
        {children}
      </body>
    </html>
  );
}
