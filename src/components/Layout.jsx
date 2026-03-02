import { NavBar } from './NavBar';
import { InboxView } from './InboxView';
import { ClarifyView } from './ClarifyView';
import { NextActionsView } from './NextActionsView';
import { SomedayMaybeView } from './SomedayMaybeView';
import { NotesView } from './NotesView';

export function Layout({ currentView, onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar currentView={currentView} onNavigate={onNavigate} />
      <main className="px-4 py-8">
        {currentView === 'inbox' && <InboxView onNavigate={onNavigate} />}
        {currentView === 'clarify' && <ClarifyView onNavigate={onNavigate} />}
        {currentView === 'next_actions' && <NextActionsView onNavigate={onNavigate} />}
        {currentView === 'someday_maybe' && <SomedayMaybeView />}
        {currentView === 'notes' && <NotesView />}
      </main>
    </div>
  );
}
