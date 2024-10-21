import React, { useState, useEffect, useCallback } from 'react'
import { debounce } from '../utils'
import useDebounce from '../hook/useDebounce'
const { invoke, send } = window.electron.ipcRenderer
export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState('')
  const [text, setText] = useState('')
  const [previewImageList, setPreviewImageList] = useState(['default'])
  const [defaultimg, setDefaultImg] = useState('')
  const [hideSec, setHideSec] = useState(0)
  // const [chooseDisplayType, setChooseDisplayType] = useState('Text')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useDebounce(text, 1000, (newText) => {
    console.log('Sending API request with text:', newText)
    send('setTxt', newText)
  })

  useDebounce(windowSize, 1000, (newWindowSize) => {
    send('setOverlayWindowSize', newWindowSize)
  })

  useDebounce(hideSec, 1000, (newHideSec) => {
    const formatSec = newHideSec * 1000
    send('setOverlayHideSec', formatSec)
  })

  // 開頭第一個為上下(上-T , 中-M , 下-B) 、第二個為左右 (左-L , 中-M , 右-R)
  const displayPlace = [
    ['TL', 'TM', 'TR'],
    ['ML', 'MM', 'MR'],
    ['BL', 'BM', 'BR']
  ]
  const getImageList = () => {
    invoke('getAllImages').then((res) => {
      if (res.files.length === 0) return
      const { files, path } = res

      const filePathArray = files.map((file) => {
        return encodeURI('file://' + path.replace(/\\/g, '/') + '/' + file)
      })
      setPreviewImageList(['default', ...filePathArray])
    })
  }

  const onChangeTxt = (e) => {
    const newText = e.target.value
    setText(newText)
  }

  const onChangeRangerBar = (e) => {
    try {
      let key = e.target.name === 'screenX' ? 'width' : 'height'
      setWindowSize((prev) => {
        return { ...prev, [key]: +e.target.value }
      })
    } catch (error) {
      console.log(error)
    }
  }

  const onChangeSecText = (e) => {
    setHideSec(e.target.value)
  }

  const uploadImg = () => {
    invoke('upload-img').then((res) => {
      // const formatPath = encodeURI('file://' + res.filePath.replace(/\\/g, '/'))
      // setPreviewImage(formatPath)
      if (res.success) {
        alert('upload success')
        getImageList()
      }
    })
  }
  const deleteImg = () => {
    const getPath = defaultimg.replace('file://', '')

    invoke('delete-img', getPath).then((res) => {
      if (res.success) {
        alert('delete success')
        setDefaultImage('default')
        getImageList()
      } else {
        alert(res.errorMsg)
      }
    })
  }
  const setDefaultImage = (imgSrc) => {
    setDefaultImg(imgSrc)
    send('setDefaultImage', imgSrc)
  }

  const setTipsPlace = (place) => {
    send('setPlace', place)
    setSelectedPlace(place)
  }

  useEffect(() => {
    invoke('getOpenSetting').then((res) => {
      setSelectedPlace(res.displayPlace)
      setDefaultImg(res.displayImage)
      setText(res.displayTxt)
      setHideSec(res.hideSec / 1000)
    })
    invoke('getOverlayWindowSize').then((res) => {
      setWindowSize(res)
    })
    getImageList()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('getAllImages')
    }
  }, [])

  return (
    <div className="home-background w-[100vw] h-[100vh] flex flex-col items-center gap-2">
      {/* 選擇切換 */}
      {/* <div className="w-8/12  p-2">
        <h3 className="text-center">Display</h3>
        <hr className="my-5" />
        <div className="flex justify-around">
          {displayType.map((v) => {
            return (
              <div key={v}>
                <label htmlFor={v} className="px-5">
                  {v}
                </label>
                <input
                  type="radio"
                  name={v}
                  id={v}
                  value={v}
                  onChange={(e) => {
                    setChooseDisplayType(e.target.value)
                  }}
                  checked={v === chooseDisplayType}
                />
              </div>
            )
          })}
        </div>
      </div> */}

      <label htmlFor="hideSec">Display Time</label>
      <input
        className="text-black"
        type="text"
        name="hideSec"
        id="hideSec"
        value={hideSec}
        onChange={onChangeSecText}
      />
      {/* overlay window size  */}
      <div className="w-8/10 flex items-center justify-center gap-5">
        <div>
          <label htmlFor="screenX">Width</label>
          <input
            type="range"
            name="screenX"
            id="screenX"
            value={windowSize.width}
            min="135"
            max="500"
            step="5"
            onChange={onChangeRangerBar}
          />
          <span>{windowSize.width}</span>
        </div>
        <div>
          <label htmlFor="screenY">Height</label>
          <input
            type="range"
            name="screenY"
            id="screenY"
            value={windowSize.height}
            min="40"
            max="200"
            step="5"
            onChange={onChangeRangerBar}
          />
          <span>{windowSize.height}</span>
        </div>
      </div>
      {/*dispaly controler , text or image */}
      <div className="w-full flex justify-center">
        {/* {chooseDisplayType === 'Text' ? (
          <div>
            <h3>Text</h3>
            <input className="text-black" type="text" value={text} onChange={onChangeTxt} />
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-center gap-10 my-5">
              <h3>Change Tips Images</h3>
              <button className="rounded-xl p-2 bg-blue-400" onClick={uploadImg}>
                Upload New Image
              </button>
            </div>
            <div className="w-[80vw] h-[30vh] flex flex-wrap overflow-y-auto overflow-x-hidden rounded-xl p-5">
              {previewImageList.length > 0 &&
                previewImageList?.map((filePath, index) => {
                  return (
                    <div
                      key={filePath}
                      className="flex items-center justify-center w-1/3 h-2/3 p-3 rounded-xl"
                      onClick={() => {
                        setDefaultImage(filePath)
                      }}
                    >
                      <div
                        className="w-full h-full p-2 cursor-pointer rounded-xl hover:outline  outline-gray-400"
                        style={defaultimg === filePath ? { outline: '2px solid red' } : {}}
                      >
                        {filePath !== 'default' ? (
                          <img className="w-full h-full" src={filePath} alt="" />
                        ) : (
                          <div className="text-center">
                            <h5>Only Display Text</h5>
                            <input
                              className="text-black"
                              type="text"
                              value={text}
                              onChange={onChangeTxt}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )} */}
        <div className="p-5">
          <div className="flex items-center gap-10 my-5">
            <h3>Change Tips Images</h3>
            <button className="rounded-xl p-2 bg-blue-400" onClick={uploadImg}>
              Upload New Image
            </button>
            <button className="rounded-xl p-2 bg-blue-400" onClick={deleteImg}>
              Delete
            </button>
          </div>
          <div className="w-[80vw] h-[30vh] flex flex-wrap overflow-y-auto overflow-x-hidden rounded-xl p-5">
            {previewImageList.length > 0 &&
              previewImageList?.map((filePath, index) => {
                return (
                  <div
                    key={filePath}
                    className="flex items-center justify-center w-1/3 h-2/3 p-3 rounded-xl"
                    onClick={() => {
                      setDefaultImage(filePath)
                    }}
                  >
                    <div
                      className="w-full h-full p-2 cursor-pointer rounded-xl hover:outline  outline-gray-400"
                      style={defaultimg === filePath ? { outline: '2px solid red' } : {}}
                    >
                      {filePath !== 'default' ? (
                        <img className="w-full h-full" src={filePath} alt="" />
                      ) : (
                        <div className="text-center">
                          <h5>Only Display Text</h5>
                          <input
                            className="text-center text-black"
                            type="text"
                            value={text}
                            onChange={onChangeTxt}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      {/* overlay window position */}
      <div className="w-8/12">
        <h3 className="text-center">Position Setting</h3>
        <hr />
        <div className="flex justify-center">
          <div className="w-96 h-52 border-2 border-white flex flex-col gap-2 p-2 rounded-lg">
            {displayPlace.map((row) => {
              return (
                <div className="w-full h-1/3 flex gap-1" key={row}>
                  {row.map((place) => {
                    const defaultClassName =
                      'border-2 border-white rounded-lg w-1/3 text-center cursor-pointer '
                    const newClassName =
                      selectedPlace === place
                        ? defaultClassName + 'bg-slate-400'
                        : defaultClassName + 'hover:bg-slate-800'
                    return (
                      <div
                        key={place}
                        className={newClassName}
                        style={selectedPlace === place ? { backgroundColor: '' } : {}}
                        onClick={() => {
                          setTipsPlace(place)
                        }}
                      >
                        <p>{place}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
