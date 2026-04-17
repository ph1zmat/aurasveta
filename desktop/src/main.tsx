import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { TRPCProvider } from './lib/trpc'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <HashRouter>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </HashRouter>
  </ErrorBoundary>,
)
