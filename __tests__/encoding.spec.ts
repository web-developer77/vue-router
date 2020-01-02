import {
  encodeHash,
  encodeParam,
  encodeQueryProperty,
  // decode,
} from '../src/utils/encoding'

describe('Encoding', () => {
  // all ascii chars with a non ascii char at the beginning
  // let allChars = ''
  // for (let i = 32; i < 127; i++) allChars += String.fromCharCode(i)

  // per RFC 3986 (2005), strictest safe set
  const unreservedSet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~'
  // Other safePerSpec sets are defined by following the URL Living standard https://url.spec.whatwg.org without chars from unreservedSet

  let nonPrintableASCII = ''
  let encodedNonPrintableASCII = ''
  for (let i = 0; i < 32; i++) {
    nonPrintableASCII += String.fromCharCode(i)
    const hex = i.toString(16).toUpperCase()
    encodedNonPrintableASCII += '%' + (hex.length > 1 ? hex : '0' + hex)
  }

  describe('params', () => {
    // excludes ^ and ` even though they are safe per spec because all browsers encode it when manually entered
    const safePerSpec = "!$&'()*+,:;=@[]_|"
    const toEncode = ' "<>#?{}/^`'
    const encodedToEncode = toEncode
      .split('')
      .map(c => {
        const hex = c
          .charCodeAt(0)
          .toString(16)
          .toUpperCase()
        return '%' + (hex.length > 1 ? hex : '0' + hex)
      })
      .join('')

    it('does not encode safe chars', () => {
      expect(encodeParam(unreservedSet)).toBe(unreservedSet)
    })

    it('encodes non-ascii', () => {
      expect(encodeParam('é')).toBe('%C3%A9')
    })

    it('encodes non-printable ascii', () => {
      expect(encodeParam(nonPrintableASCII)).toBe(encodedNonPrintableASCII)
    })

    it('does not encode a safe set', () => {
      expect(encodeParam(safePerSpec)).toBe(safePerSpec)
    })

    it('encodes a specific charset', () => {
      expect(encodeParam(toEncode)).toBe(encodedToEncode)
    })
  })

  describe('query params', () => {
    const safePerSpec = "!$'*+,:;@[]_|?/{}^()`"
    const toEncode = ' "<>#&='
    const encodedToEncode = toEncode
      .split('')
      .map(c => {
        const hex = c
          .charCodeAt(0)
          .toString(16)
          .toUpperCase()
        return '%' + (hex.length > 1 ? hex : '0' + hex)
      })
      .join('')

    it('does not encode safe chars', () => {
      expect(encodeQueryProperty(unreservedSet)).toBe(unreservedSet)
    })

    it('encodes non-ascii', () => {
      expect(encodeQueryProperty('é')).toBe('%C3%A9')
    })

    it('encodes non-printable ascii', () => {
      expect(encodeQueryProperty(nonPrintableASCII)).toBe(
        encodedNonPrintableASCII
      )
    })

    it('does not encode a safe set', () => {
      expect(encodeQueryProperty(safePerSpec)).toBe(safePerSpec)
    })

    it('encodes a specific charset', () => {
      expect(encodeQueryProperty(toEncode)).toBe(encodedToEncode)
    })
  })

  describe('hash', () => {
    const safePerSpec = "!$'*+,:;@[]_|?/{}^()#&="
    const toEncode = ' "<>`'
    const encodedToEncode = toEncode
      .split('')
      .map(c => {
        const hex = c
          .charCodeAt(0)
          .toString(16)
          .toUpperCase()
        return '%' + (hex.length > 1 ? hex : '0' + hex)
      })
      .join('')

    it('does not encode safe chars', () => {
      expect(encodeHash(unreservedSet)).toBe(unreservedSet)
    })

    it('encodes non-ascii', () => {
      expect(encodeHash('é')).toBe('%C3%A9')
    })

    it('encodes non-printable ascii', () => {
      expect(encodeHash(nonPrintableASCII)).toBe(encodedNonPrintableASCII)
    })

    it('does not encode a safe set', () => {
      expect(encodeHash(safePerSpec)).toBe(safePerSpec)
    })

    it('encodes a specific charset', () => {
      expect(encodeHash(toEncode)).toBe(encodedToEncode)
    })
  })
})
