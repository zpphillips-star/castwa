'use client'
import { StarredProvider } from '@/hooks/useStarred'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <StarredProvider>{children}</StarredProvider>
}
