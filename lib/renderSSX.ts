import { renderComponent } from '@lumeland/ssx/jsx-runtime';
import { Response } from 'express'

export async function renderSSX(res: Response, it: JSX.Component | Promise<JSX.Component>): Promise<void> {
    const component = it instanceof Promise ? await it : it
    try {
        const page = await renderComponent(component)
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
