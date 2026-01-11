import { renderComponent } from '@lumeland/ssx/jsx-runtime';
import { Response } from 'express'

export async function renderSSX(res: Response, it: JSX.Component | Promise<JSX.Component>): Promise<void> {
    if (it instanceof Promise) {
        it.then((resolved: JSX.Component) => renderSSX(res, resolved))
          .catch((e: unknown) => { throw e instanceof Error ? e : new Error(e.toString()) });
        return;
    }
    try {
        const page = await renderComponent(it)
        res.set('Content-Type', 'text/html; charset=utf-8')
        res.send(page)
    } catch (e) {
        res.set('Content-Type', 'text/plain; charset=utf-8')
        res.status(500)
        res.send("Internal server error: " + e.toString())
    } finally {
        res.end()
    }
}
