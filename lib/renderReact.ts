import { ReactNode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { Response } from 'express'

/* Per https://nodejs.org/api/stream.html, the default behaviour of piping is
   to end the target stream, so we don't always call end() explicitly here */
export function renderReact(res: Response, it: ReactNode | Promise<ReactNode>): void {
    if (it instanceof Promise) {
        it.then((resolved: ReactNode) => renderReact(res, resolved))
          .catch((e: unknown) => { throw e instanceof Error ? e : new Error(e.toString()) });
        return;
    }
    res.set('Content-Type', 'text/html; charset=utf-8')
    const { pipe } = renderToPipeableStream(it, {
        onAllReady() { pipe(res) },
        onError(e: unknown) {
            res.set('Content-Type', 'text/plain; charset=utf-8')
            res.status(500)
            res.send("Internal server error: " + e.toString())
            res.end()
        }
    })
}
