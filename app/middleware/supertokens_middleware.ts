import { middleware as supertokensMiddleware } from 'supertokens-node/framework/express'
import type { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class SupertokensMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    const expressMiddleware = supertokensMiddleware()

    const nodeReq = ctx.request.request

    const expressReq: any = Object.create(nodeReq)
    expressReq.method = ctx.request.method()
    expressReq.query = { ...ctx.request.qs() }
    expressReq.body = ctx.request.body()
    expressReq.originalUrl = ctx.request.url(true)
    expressReq.path = ctx.request.url()
    expressReq.headers = ctx.request.headers()
    expressReq.get = (headerName: string) => ctx.request.header(headerName)

    let ended = false
    let responseStatus = 200
    let responseHeaders: Record<string, string | string[]> = {}
    let responseBody: any = null
    let resolvePromise: (() => void) | null = null

    const finalizeResponse = () => {
      if (ended && resolvePromise) {
        resolvePromise()
      }
    }

    const expressRes: any = {
      status(code: number) {
        responseStatus = code
        return this
      },
      setHeader(name: string, value: string | string[]) {
        name = name.toLowerCase()
        if (name === 'set-cookie') {
          if (typeof value === 'string') {
            responseHeaders[name] = value
          } else {
            responseHeaders[name] = value
          }
        } else {
          responseHeaders[name] = value
        }
      },
      getHeader(name: string) {
        name = name.toLowerCase()
        const val = responseHeaders[name]
        if (val === undefined) {
          return undefined
        }
        if (name === 'set-cookie') {
          return Array.isArray(val) ? (val.length === 1 ? val[0] : val) : val
        }
        return val
      },
      removeHeader(name: string) {
        name = name.toLowerCase()
        delete responseHeaders[name]
      },
      end(body?: any) {
        if (!ended) {
          if (body !== undefined) {
            responseBody = body
          }
          ended = true
          finalizeResponse()
        }
        return this
      },
      send(body: any) {
        if (!ended) {
          responseBody = body
          ended = true
          finalizeResponse()
        }
        return this
      },
      json(obj: any) {
        if (!ended) {
          this.setHeader('content-type', 'application/json')
          responseBody = JSON.stringify(obj)
          ended = true
          finalizeResponse()
        }
        return this
      },
      getHeaders() {
        const headersCopy: Record<string, string | string[]> = {}
        for (const [key, val] of Object.entries(responseHeaders)) {
          headersCopy[key] = val
        }
        return headersCopy
      },
      get headersSent() {
        return ended
      },
      get writableEnded() {
        return ended
      },
    }

    try {
      await new Promise<void>((resolve, reject) => {
        resolvePromise = resolve
        expressMiddleware(expressReq, expressRes, (err: any) => {
          if (err) return reject(err)
          if (!ended) {
            resolve()
          }
        })
      })

      if (ended) {
        for (const [name, val] of Object.entries(responseHeaders)) {
          if (name === 'set-cookie') {
            if (Array.isArray(val)) {
              for (const cookie of val) {
                ctx.response.append('Set-Cookie', cookie) // Changed from header to append
              }
            } else {
              ctx.response.append('Set-Cookie', val) // Changed from header to append
            }
          } else {
            ctx.response.header(name, val)
          }
        }
        ctx.response.status(responseStatus)
        ctx.response.send(responseBody ?? '')
      } else {
        await next()
      }
    } catch (error) {
      console.error('Erreur dans SupertokensMiddleware :', error)
      ctx.response.status(500).send('Erreur interne du serveur')
    }
  }
}
