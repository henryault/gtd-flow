import { useState, useEffect } from 'react'
import { ItemsProvider } from './context/ItemsContext'
import { useItemsContext } from './context/ItemsContext'
import { Layout } from './components/Layout'

/** Checks URL for ?add=text on mount, adds to inbox, cleans URL */
function QuickCapture() {
  const { addItem } = useItemsContext()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const text = params.get('add')
    if (text && text.trim()) {
      addItem(text.trim())
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [addItem])

  return null
}

function AppShell() {
  const { inboxItems } = useItemsContext()
  const [currentView, setCurrentView] = useState(() =>
    inboxItems.length > 0 ? 'inbox' : 'next_actions'
  )

  return (
    <>
      <QuickCapture />
      <Layout currentView={currentView} onNavigate={setCurrentView} />
    </>
  )
}

function App() {
  return (
    <ItemsProvider>
      <AppShell />
    </ItemsProvider>
  )
}

export default App
