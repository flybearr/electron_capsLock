import React from 'react'
import { createHashRouter } from 'react-router-dom'
import Home from '../page/home'
import Overlay from '../page/overlay'

export const router = createHashRouter(
  [
    {
      path: '/',
      // element: <Layout />,
      children: [
        {
          path: '',
          element: <Home />
        },
        {
          path: 'overlay',
          element: <Overlay />
        }
      ]
    }
  ],
  { basename: '' }
)
