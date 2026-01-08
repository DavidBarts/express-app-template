import { ReactNode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { renderReact } from "../lib/renderReact"
import { Page, Header, Body } from "../lib/template"
import { Request, Response } from 'express'

export function get(req: Request, res: Response): void {
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

    renderReact(res, document)
}
