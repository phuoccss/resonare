/**
 * `JSON.stringify` for embedding in an inline `<script>`: `<` is escaped so a
 * value containing `</script>` cannot close the tag.
 */
export const toScriptJson = (value: unknown): string => {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/**
 * Source of `handler` as a JavaScript expression. Object-method shorthand
 * (`handler() {}`) stringifies to something that is not an expression on its
 * own, so it is wrapped back into an object literal.
 */
export const toScriptFunction = (handler: Function): string => {
  const source = String(handler)

  return /^(async\s*)?(function\b|\(|[\w$]+\s*=>)/.test(source)
    ? source
    : `Object.values({${source}})[0]`
}
