export const splice = (string, inserted, start, deleteCount = 0) => {
  return string.slice(0, start) + inserted + string.slice(start + deleteCount)
}

export const isDigit = (char) => {
  return /^\d$/.test(char)
}

export const extractDigits = (value) => {
  return typeof value === 'string' ? value.replace(/\D/g, '') : ''
}

export class LostSymbolsBuffer {
  constructor (maxLength) {
    this.buffer = []
    this._maxLength = maxLength
  }

  add (string) {
    if (!string) return

    this.buffer.unshift(...(string.split('')))
    this.buffer.splice(this._maxLength)
  }

  restore (length) {
    if (length === 0) return ''

    length = Math.min(length, this.buffer.length)
    return this.buffer.splice(0, length).join('')
  }

  restoreAll () {
    return this.restore(this.buffer.length)
  }

  reset () {
    this.buffer = []
  }
}
