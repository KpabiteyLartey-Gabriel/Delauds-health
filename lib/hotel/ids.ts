export function nanoid(size = 12): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
  const buf = new Uint8Array(size)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < size; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  let id = ""
  for (let i = 0; i < size; i++) id += alphabet[buf[i]! % alphabet.length]
  return id
}
