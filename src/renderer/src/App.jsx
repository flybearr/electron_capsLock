import { Route, Routes, HashRouter, RouterProvider } from 'react-router-dom'
import { router } from './router'
// import Home from './page/home'
function App() {
  return (
    // <HashRouter>
    //   <Routes>
    //     <Route path="/" element={<Home />} />
    //   </Routes>
    // </HashRouter>
    <RouterProvider router={router} />
  )
}

export default App
