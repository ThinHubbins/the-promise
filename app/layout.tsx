import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { Fraunces, Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'The Promise — Nigerian Fast Food & Catering, Since 2002',
  description:
    'The Promise — Nigerian fast food restaurant and catering group, serving Rivers, Lagos and Bayelsa States since 2002.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
            <Toast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
