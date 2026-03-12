import { QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './LanguageContext'
import { AudioProvider } from './AudioContext'
import { UserProvider } from './UserContext'
import { ProgressionProvider } from './ProgressionContext'
import queryClient from '../lib/queryClient'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserProvider>
          <ProgressionProvider>
            <AudioProvider>
              {children}
            </AudioProvider>
          </ProgressionProvider>
        </UserProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}
