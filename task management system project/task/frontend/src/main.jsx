import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from 'react-router-dom';


createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Toaster/>
    <BrowserRouter>
    <App  className="bg-base-100"/> 
    </BrowserRouter>
  </AuthProvider>
)
