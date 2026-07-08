'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface WaterSheetContextType {
  openWaterId: string | null
  openSheet: (id: string) => void
  closeSheet: () => void
}

const WaterSheetContext = createContext<WaterSheetContextType>({
  openWaterId: null,
  openSheet: () => {},
  closeSheet: () => {},
})

export function WaterSheetProvider({ children }: { children: ReactNode }) {
  const [openWaterId, setOpenWaterId] = useState<string | null>(null)

  return (
    <WaterSheetContext.Provider
      value={{
        openWaterId,
        openSheet: setOpenWaterId,
        closeSheet: () => setOpenWaterId(null),
      }}
    >
      {children}
    </WaterSheetContext.Provider>
  )
}

export function useWaterSheet() {
  return useContext(WaterSheetContext)
}
