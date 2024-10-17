import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  screen,
  Tray,
  Menu,
  dialog
} from 'electron'
import path, { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { promises as fs } from 'fs'
import { qKeys, qHotkeys } from 'qhotkeys'
// import logger from './model/logger'
import log from 'electron-log/main'

const { exec } = require('child_process')
log.initialize()
var hotkeys = new qHotkeys()

let overlayWindow
let isCapsLockOn = false
let HIDE_TIME = 900 // 正常情況下窗口顯示後的隱藏時間 (2秒)
let timer = null
let overLayPosition = null
let cursor = null
const overlayWindowProperty = { width: 135, height: 40 }

async function createConfigFolder() {
  const configFolder = path.join(app.getPath('userData'), 'config')
  console.log(configFolder)

  log.info(2, 'configFolder: ' + configFolder)
  try {
    await fs.mkdir(configFolder, { recursive: true })
    // console.log.info('create configFolder')
    log.info(2, 'create configFolder')
  } catch (error) {
    // console.error('Error creating config folder:', error)
    log.error('Error creating config folder:' + error)
  }
}

async function updateOpenSetting(newSettings) {
  // 取得 userData 目錄路徑
  const userDataPath = app.getPath('userData')

  // 指定 config 資料夾及 openSetting.json 的路徑
  const configFolderPath = path.join(userDataPath, 'config')
  const openSettingPath = path.join(configFolderPath, 'openSetting.json')

  try {
    // 檢查 config 資料夾是否存在，若不存在則創建
    try {
      await fs.access(configFolderPath) // 檢查資料夾是否存在
    } catch {
      await fs.mkdir(configFolderPath) // 資料夾不存在，創建資料夾
    }

    // 讀取 openSetting.json 檔案，如果存在則讀取其內容
    let currentSettings = {}
    try {
      const data = await fs.readFile(openSettingPath, 'utf8')
      currentSettings = JSON.parse(data) // 將 JSON 轉為物件
    } catch (error) {
      // 如果檔案不存在，初始化為空物件，忽略錯誤
      if (error.code !== 'ENOENT') {
        log.error(error)
        throw error // 其他錯誤拋出
      }
    }

    // 更新設定，合併新設定到原本設定中
    const updatedSettings = { ...currentSettings, ...newSettings }

    // 將更新後的設定寫回 openSetting.json
    await fs.writeFile(openSettingPath, JSON.stringify(updatedSettings, null, 2), 'utf8')
    log.info('Settings updated successfully!')
  } catch (err) {
    log.error('Error updating settings:', err)
  }
}

async function readOpenSetting() {
  try {
    // 假設你將設定檔放在 AppData 的 Roaming 目錄中
    const configPath = path.join(app.getPath('userData'), 'config', 'opensetting.json')

    // 讀取配置檔案
    const data = await fs.readFile(configPath, 'utf8')
    const settings = JSON.parse(data)

    // console.log('Settings loaded:', settings)
    return settings
  } catch (error) {
    // console.error('Error loading settings:', error)
    log.error('Error loading settings:', error)
    return null
  }
}

function createTray(win) {
  const tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'show', click: () => win.show() },
    {
      label: 'exit',
      click: () => app.quit()
    }
  ])
  tray.setToolTip('electron_tester')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    win.show()
  })
  return tray
}

async function createWindow() {
  await createConfigFolder()

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 830,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.resolve(__dirname, '../preload/index.js'),
      // sandbox: true,
      // contextIsolation: true,
      // nodeIntegration: false
      sandbox: false,
      webSecurity: false
    }
  })

  // console.log(join(__dirname, '../preload/index.js'))
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault()
      mainWindow.hide() // 隱藏窗口
    }
  })

  mainWindow.on('ready-to-show', () => {
    const screenPrpperty = screen.getAllDisplays()
    const screenArray = screenPrpperty.map((v) => {
      return {
        startPointX: v.bounds.x,
        startPointY: v.bounds.y,
        label: v.label,
        ...v.bounds
      }
    })

    //預設位置 x y

    //計算每個位置內，window 的置中 x y
    overLayPosition = screenArray.map((coordinate) => {
      const xDividedByThree = coordinate.width / 3
      const yDividedByThree = coordinate.height / 3

      let xOffset = (xDividedByThree - overlayWindowProperty.width) / 2
      let yOffset = (yDividedByThree - overlayWindowProperty.height) / 2

      const displayPlace = [
        ['TL', 'TM', 'TR'],
        ['ML', 'MM', 'MR'],
        ['BL', 'BM', 'BR']
      ]
      const newDisplayPlace = displayPlace.flat(1)
      const windowA = []

      newDisplayPlace.forEach((txt, index) => {
        const newCoordinate = { x: 0, y: 0 }

        const firstWord = txt.slice(0, 1)
        const secondWord = txt.slice(1, 2)

        // x 軸判斷
        switch (secondWord) {
          case 'L':
            newCoordinate.x = coordinate.startPointX + xOffset
            break
          case 'M':
            newCoordinate.x = coordinate.startPointX + xDividedByThree + xOffset
            break
          case 'R':
            newCoordinate.x = coordinate.startPointX + xDividedByThree * 2 + xOffset
            break

          default:
            break
        }

        // y 軸判斷
        switch (firstWord) {
          case 'T':
            newCoordinate.y = coordinate.startPointY + yOffset
            break
          case 'M':
            newCoordinate.y = coordinate.startPointY + yDividedByThree + yOffset
            break
          case 'B':
            newCoordinate.y = coordinate.startPointY + yDividedByThree * 2 + yOffset
            break

          default:
            break
        }

        windowA.push({ [txt]: newCoordinate })
      })

      return { ...coordinate, windowA }
    })

    // [
    //   {
    //     accelerometerSupport: 'unknown',
    //     bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    //     colorDepth: 24,
    //     colorSpace: '{primaries:BT709, transfer:SRGB, matrix:RGB, range:FULL}',
    //     depthPerComponent: 8,
    //     detected: true,
    //     displayFrequency: 60,
    //     id: 593177609,
    //     internal: false,
    //     label: 'BenQ GL2450',
    //     maximumCursorSize: { width: 0, height: 0 },
    //     monochrome: false,
    //     nativeOrigin: { x: 0, y: 0 },
    //     rotation: 0,
    //     scaleFactor: 1,
    //     size: { width: 1920, height: 1080 },
    //     workArea: { x: 0, y: 0, width: 1920, height: 1032 },
    //     workAreaSize: { width: 1920, height: 1032 },
    //     touchSupport: 'unknown'
    //   },
    //   {
    //     accelerometerSupport: 'unknown',
    //     bounds: { x: -1536, y: 216, width: 1536, height: 864 },
    //     colorDepth: 24,
    //     colorSpace: '{primaries:BT709, transfer:SRGB, matrix:RGB, range:FULL}',
    //     depthPerComponent: 8,
    //     detected: true,
    //     displayFrequency: 144,
    //     id: 1651037694,
    //     internal: true,
    //     label: '',
    //     maximumCursorSize: { width: 0, height: 0 },
    //     monochrome: false,
    //     nativeOrigin: { x: -1536, y: 0 },
    //     rotation: 0,
    //     scaleFactor: 1.25,
    //     size: { width: 1536, height: 864 },
    //     workArea: { x: -1536, y: 216, width: 1536, height: 816 },
    //     workAreaSize: { width: 1536, height: 816 },
    //     touchSupport: 'unknown'
    //   },
    //   {
    //     accelerometerSupport: 'unknown',
    //     bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
    //     colorDepth: 24,
    //     colorSpace: '{primaries:BT709, transfer:SRGB, matrix:RGB, range:FULL}',
    //     depthPerComponent: 8,
    //     detected: true,
    //     displayFrequency: 100,
    //     id: 426103796,
    //     internal: false,
    //     label: 'BenQ GW2490',
    //     maximumCursorSize: { width: 0, height: 0 },
    //     monochrome: false,
    //     nativeOrigin: { x: 1920, y: 0 },
    //     rotation: 0,
    //     scaleFactor: 1,
    //     size: { width: 1920, height: 1080 },
    //     workArea: { x: 1920, y: 0, width: 1920, height: 1032 },
    //     workAreaSize: { width: 1920, height: 1032 },
    //     touchSupport: 'unknown'
    //   }
    // ]
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // console.log(process.env['ELECTRON_RENDERER_URL'])

    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // console.log(join(__dirname, '../renderer/index.html'))
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// 創建一個浮動窗口顯示 Caps Lock 狀態
function createOverlayWindow() {
  readOpenSetting().then((res) => {
    overlayWindow = new BrowserWindow({
      ...overlayWindowProperty,
      frame: false, // 無邊框
      transparent: true, // 透明背景
      alwaysOnTop: true, // 始終置頂
      skipTaskbar: true, // 不顯示在任務欄
      focusable: false, // 不可聚焦
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: false,
        webSecurity: false
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      overlayWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#overlay')
    } else {
      // overlayWindow.loadFile(join(__dirname, '../renderer/index.html#overlay'))
      const overlayPath = path.join(__dirname, '../renderer/index.html')
      overlayWindow.loadURL(`file://${overlayPath}#overlay`)
    }

    // overlayWindow.loadFile('overlay.html')

    overlayWindow.hide() // 初始時隱藏
  })
}

function registerCapsLockShortcut() {
  exec(
    'powershell.exe $CapsLock = [console]::CapsLock; echo $CapsLock',
    (error, stdout, stderr) => {
      if (error) {
        log.error(`Error: ${error}`)
        return
      }

      isCapsLockOn = stdout.trim() === 'True' ? true : false

      hotkeys.register([qKeys.CapsLock], () => {
        const newCapsLockState = !isCapsLockOn
        const newCursor = screen.getCursorScreenPoint()
        if (JSON.stringify(cursor) !== JSON.stringify(newCursor)) {
          cursor = newCursor

          readOpenSetting().then((res) => {
            const displace = res.displayPlace
            const findScreen = overLayPosition.find(
              (v) => newCursor.x > v.startPointX && newCursor.x < v.startPointX + v.width
            )
            const findPlace = findScreen?.windowA.find(
              (place) => Object.keys(place)[0] === displace
            )

            const coordinate = { x: findPlace[displace].x, y: findPlace[displace].y }

            overlayWindow.setBounds({ ...coordinate, ...overLayPosition })
          })
        }

        if (timer) clearTimeout(timer)

        // 如果 Caps Lock 狀態變更

        isCapsLockOn = newCapsLockState
        // lastTimeWindowShown = currentTime

        // 如果用戶在短時間內多次按下 Caps Lock，則認為是「瘋狂按」，不隱藏窗口

        // 更新文字內容
        overlayWindow.webContents.send('capslock-changed', isCapsLockOn)

        overlayWindow.show()
        timer = setTimeout(() => {
          overlayWindow.hide() // 隱藏浮動窗口
        }, HIDE_TIME) // 設定浮動窗口顯示時間為 2 秒

        // }, DEBOUNCE_DELAY) // 設置防抖延遲時間，避免頻繁觸發
      })

      hotkeys.run()
    }
  )
}

async function readImageToBase64(filePath) {
  const data = await fs.readFile(filePath)
  let base64Image = Buffer.from(data, 'binary').toString('base64')
  return base64Image
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows

  electronApp.setAppUserModelId('com.electron')

  // IPC test

  ipcMain.on('message', (e, message) => {
    console.log('e' + JSON.stringify(e))
  })

  ipcMain.handle('getOpenSetting', async (event) => {
    const openSetting = await readOpenSetting()
    return openSetting
  })
  // ipcMain.on('APImessage', (event, data) => {
  //   console.log('getData:', JSON.stringify(data))
  //   // 可以在這裡處理資料並回應
  //   event.reply('reply-message', { status: 'success', receivedData: data })
  // })

  createWindow().then(async (win) => {
    cursor = screen.getCursorScreenPoint()
    createTray(win)
    createOverlayWindow()
    registerCapsLockShortcut()

    win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
        win.webContents.toggleDevTools() // F12 開關 DevTools
        event.preventDefault() // 防止預設行為
      }
    })

    ipcMain.handle('getAllImages', async () => {
      // 非同步讀取 'uploads' 資料夾內的檔案
      const uploadFolder = path.join(app.getPath('userData'), 'upload')
      console.log(app.getPath('userData'))

      try {
        await fs.access(uploadFolder) // 檢查資料夾是否存在
      } catch {
        await fs.mkdir(uploadFolder) // 資料夾不存在，創建資料夾
      }

      try {
        const files = await fs.readdir(uploadFolder) // 使用 fs.promises 進行非同步讀取
        return { files: files, path: uploadFolder }
        // 當檔案讀取完成後，將檔案名稱陣列發送到前端
      } catch (error) {
        console.error('Error reading directory:', error.message)
      }
    })

    // ipcMain.send('getScreenSize', overLayPosition)
    ipcMain.on('setPlace', (e, message) => {
      const place = message
      updateOpenSetting({ displayPlace: place })
    })

    ipcMain.handle('getOverlayWindowSize', async () => {
      return overlayWindowProperty
    })

    ipcMain.on('setOverlayWindowSize', (e, m) => {
      const { width, height } = m
      overlayWindow.setSize(width, height)
    })

    ipcMain.on('setDefaultImage', (e, message) => {
      const imgSrc = message
      updateOpenSetting({ displayImage: imgSrc }).then((res) => {
        overlayWindow.webContents.send('setOverlayImg', imgSrc)
      })
    })

    ipcMain.handle('upload-img', async (e) => {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'gif'] }]
      })
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const fileName = path.basename(filePath)

        const uploadFolder = path.join(app.getPath('userData'), 'upload')
        try {
          await fs.access(uploadFolder) // 檢查資料夾是否存在
        } catch {
          await fs.mkdir(uploadFolder) // 資料夾不存在，創建資料夾
        }

        const savePath = path.join(uploadFolder, fileName)
        try {
          await fs.copyFile(filePath, savePath)
        } catch (error) {
          console.log(error.message)
        }
        // const base64Image = await readImageToBase64(savePath)
        return { success: true, filePath: savePath, fileName: fileName }
      } else {
        return { success: false }
      }
    })

    ipcMain.on('setTxt', (e, message) => {
      const txt = message
      overlayWindow.webContents.send('txtMessage', txt)
      updateOpenSetting({ displayTxt: txt })
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
