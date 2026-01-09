import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastProvider } from '../components/ui/Toast'
import { ModalProvider } from '../components/ui/ModalProvider'
import { Footer } from '../components/Footer'

export default function App({ Component, pageProps }: AppProps) {
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
