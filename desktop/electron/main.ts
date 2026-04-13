import { app, BrowserWindow, Notification, ipcMain } from 'electron'
import path from 'node:path'
import Store from 'electron-store'

const store = new Store<{
  apiUrl: string
  sessionToken: string | null
  windowBounds: { width: number; height: number; x?: number; y?: number }
}>({
  defaults: {
    apiUrl: 'https://aurasveta.ru',
    sessionToken: null,
    windowBounds: { width: 1280, height: 800 },
  },
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  const bounds = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 900,
    minHeight: 600,
    title: 'Аура Света CMS',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Загрузка Vite dev-server или сборки
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Сохранение размеров окна
  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('windowBounds', bounds)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handlers
ipcMain.handle('store:get', (_event, key: string) => store.get(key))
ipcMain.handle('store:set', (_event, key: string, value: unknown) => store.set(key, value))

ipcMain.handle('notification:show', (_event, title: string, body: string, data?: Record<string, string>) => {
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '../public/icon.png'),
  })

  notification.on('click', () => {
    mainWindow?.focus()
    if (data?.orderId) {
      mainWindow?.webContents.send('navigate', `/orders/${data.orderId}`)
    }
  })

  notification.show()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
