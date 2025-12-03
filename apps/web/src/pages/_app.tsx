import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastProvider } from '../components/ui/Toast'
import { ModalProvider } from '../components/ui/ModalProvider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ModalProvider>
        <Component {...pageProps} />
      </ModalProvider>
    </ToastProvider>
  )
}
