import '@lumeland/ssx/jsx-runtime'
import { renderSSX } from "../lib/renderSSX"
import { Page, Header, Body } from "../lib/template"
import { Request, Response } from 'express'

export async function get(req: Request, res: Response): Promise<void> {
    const document = (
        <Page>
          <Header>
            <title>Test</title>
          </Header>
          <Body>
            <h1>This Is a Test</h1>
            <p>Will it work?</p>
          </Body>
        </Page>
    )

    await renderSSX(res, document)
}
