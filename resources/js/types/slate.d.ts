import { BaseEditor } from "slate"
import { ReactEditor } from "slate-react"

export type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

export type CustomElement = {
  type:
    | "paragraph"
    | "heading-one"
    | "heading-two"
    | "block-quote"
    | "code"
    | "bulleted-list"
    | "numbered-list"
    | "list-item"
  children: CustomText[]
}

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}