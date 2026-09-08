import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTokenStorage } from './api/tokenStorage'
import { initNativeChrome } from './lib/nativeChrome'

async function bootstrap() {
  try {
    await initTokenStorage()
  } catch (err) {
    console.error('토큰 저장소 초기화 실패:', err)
  }

  try {
    await initNativeChrome()
  } catch (err) {
    console.error('네이티브 UI 초기화 실패:', err)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
