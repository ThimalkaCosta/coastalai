import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DataProvider } from './context/DataContext'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
