import { readFile } from 'node:fs/promises';
import '@lumeland/ssx/jsx-runtime';

const READ_OPTS: { encoding: BufferEncoding } = { encoding: 'utf8' }

export async function Page({ children } : { children?: JSX.Children }): Promise<JSX.Component> {
  return (
    <>
      {{ __html: "<!DOCTYPE html>" }}
      <html lang="en-CA">
        {children ?? ""}
      </html>
    </>
  )
}

export async function Header({ children } : { children?: JSX.Children }): Promise<JSX.Component> {
  return (
    <head>
      <meta charset="utf-8" />
      <meta name="robots" content="nofollow"/>
      {children ?? ""}
    </head>
  )
}

export async function Body({ children } : { children?: JSX.Children }): Promise<JSX.Component> {
  return (
    <body>
      {children ?? ""}
      <hr />
      <p>I am a footer.</p>
    </body>
  )
}

export async function Script(props : { file: string } | { text: string }): Promise<JSX.Component> {
  const data = 'file' in props ? await readFile(props.file, READ_OPTS) : props.text
  return (
    <script dangerouslySetInnerHTML={{__html: data}} />
  )
}

export async function Style(props : { file: string } | { text: string }): Promise<JSX.Component> {
  const data = 'file' in props ? await readFile(props.file, READ_OPTS) : props.text
  return (
    <style dangerouslySetInnerHTML={{__html: data}} />
  )
}
