import { dialog } from 'electron'

async function showMessageBox() {
  const response = await dialog.showMessageBox({
    type: 'info', // 類型可以是 'none', 'info', 'error', 'question', 'warning'
    title: '訊息',
    message: '這是一個訊息框範例',
    buttons: ['OK', 'Cancel']
  })

  console.log('使用者選擇:', response.response) // response.response 是選擇的按鈕索引
}

async function showOpenDialog() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '選擇檔案',
    properties: ['openFile', 'multiSelections'], // 'openFile' 讓使用者選擇檔案, 'multiSelections' 允許多選
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] } // 過濾條件
    ]
  })

  if (!canceled) {
    console.log('選擇的檔案路徑:', filePaths)
  }
}

async function showSaveDialog() {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '保存檔案',
    defaultPath: 'untitled.txt', // 預設的檔名
    filters: [
      { name: 'Text Files', extensions: ['txt'] } // 過濾條件
    ]
  })

  if (!canceled && filePath) {
    console.log('保存的檔案路徑:', filePath)
  }
}

function showErrorBox() {
  dialog.showErrorBox('錯誤標題', '這是一個錯誤訊息')
}

async function askUser() {
  const response = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    title: 'Confirm',
    message: '你確定要繼續嗎？'
  })

  if (response.response === 0) {
    console.log('使用者選擇 Yes')
  } else {
    console.log('使用者選擇 No')
  }
}

export { showErrorBox, askUser , showSaveDialog,showOpenDialog , showMessageBox}
