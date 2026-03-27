import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastProvider } from '../components/ui/Toast'
import { ModalProvider } from '../components/ui/ModalProvider'
import { Footer } from '../components/Footer'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Add 'is-native' class if running on Capacitor native platform
    if (typeof window !== 'undefined') {
      const isNative = (window as any).Capacitor?.isNativePlatform();
      if (isNative) {
        document.body.classList.add('is-native');
      }
    }
  }, [])

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}
