import type { ApplicationService } from '@adonisjs/core/types'
import SuperTokens from 'supertokens-node'
import Session from 'supertokens-node/recipe/session'
import Dashboard from 'supertokens-node/recipe/dashboard'
import EmailPassword from 'supertokens-node/recipe/emailpassword'
import UserRoles from 'supertokens-node/recipe/userroles'

export default class SupertokenProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    SuperTokens.init({
      framework: 'express',
      appInfo: {
        appName: 'EzionAdmin',
        apiDomain: 'http://localhost:3333',
        websiteDomain: 'http://localhost:5173',
        apiBasePath: '/auth',
      },
      supertokens: { connectionURI: 'http://localhost:3567' },
      recipeList: [Session.init(), EmailPassword.init(), Dashboard.init(), UserRoles.init()],
    })
  }
}
