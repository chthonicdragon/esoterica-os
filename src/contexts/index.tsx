import { QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './LanguageContext'
import { AudioProvider } from './AudioContext'
import { UserProvider } from './UserContext'
import { ProgressionProvider } from './ProgressionContext'
import { ThemeProvider } from './ThemeContext'
import queryClient from '../lib/queryClient'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider>
          <LanguageProvider>
            <ProgressionProvider>
              <AudioProvider>
                {children}
              </AudioProvider>
            </ProgressionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}
