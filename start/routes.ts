/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router.on('/').render('pages/home')

router
  .group(() => {
    router.post('/auth/signin', async () => {})
    router.post('/auth/signup', async () => {})
    router.get('/auth/dashboard', async () => {})
    router.any('/auth/dashboard/*', async () => {})
    router.any('/auth/public/dashboard/*', async () => {})
  })
  .use(middleware.supertokens())
