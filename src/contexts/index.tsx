import { QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './LanguageContext'
import { AudioProvider } from './AudioContext'
import { UserProvider } from './UserContext'
import { ProgressionProvider } from './ProgressionContext'
import queryClient from '../lib/queryClient'
import { ThemeProvider } from '../components/ThemeProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <LanguageProvider>
          <UserProvider>
            <ProgressionProvider>
              <AudioProvider>
                {children}
              </AudioProvider>
            </ProgressionProvider>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
