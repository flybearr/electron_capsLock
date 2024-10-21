import React, { useState, useEffect } from 'react'
export default function Overlay() {
  const [capsLockBoolean, setCapsLockBoolean] = useState('')
  const [displayTxt, setDisplayTxt] = useState('')
  const [img, setImg] = useState('')
  const getSetting = () => {
    window.electron.ipcRenderer.invoke('getOpenSetting').then((res) => {
      // console.log('取得openSetting' + JSON.stringify(res))

      setDisplayTxt(res.displayTxt)
      setImg(res.displayImage)
    })
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('capslock-changed', (e, m) => {
      setCapsLockBoolean(m)
    })
    window.electron.ipcRenderer.on('txtMessage', (e, m) => {
      setDisplayTxt(m)
    })
    getSetting()
    window.electron.ipcRenderer.on('setOverlayImg', (e, m) => {
      const imgSrc = m
      setImg(imgSrc)
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('capslock-changed')
      window.electron.ipcRenderer.removeAllListeners('txtMessage')
      window.electron.ipcRenderer.removeAllListeners('setOverlayImg')
    }
  }, [])
  return (
    <div
      className="w-[100vw] h-[100vh] border-2  rounded-2xl overflow-hidden"
      style={capsLockBoolean ? { borderColor: 'green' } : { borderColor: 'red' }}
    >
      {img !== 'default' ? (
        <img className="w-[100vw] h-[100vh] object-cover" src={img} alt={img} />
      ) : (
        <p className="text-center text-white py-2">
          {displayTxt} {capsLockBoolean ? 'on' : 'off'}
        </p>
      )}
    </div>
  )
}
