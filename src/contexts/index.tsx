import { QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './LanguageContext'
import { AudioProvider } from './AudioContext'
import queryClient from '../lib/queryClient'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AudioProvider>
          {children}
        </AudioProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
