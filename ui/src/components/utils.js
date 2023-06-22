import examples from 'libphonenumber-js/mobile/examples'
import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  getExampleNumber,
  parsePhoneNumber,
  ParseError
} from 'libphonenumber-js'

export const extractNumbers = (value) => {
  return typeof value === 'string' ? value.replace(/\D/g, '') : ''
}

const locale = navigator ? navigator.language : 'en'
const getCountryDisplayName = new Intl.DisplayNames([locale], { type: 'region' })

export const countries = getCountries()

export const countriesMap = Object.fromEntries(countries.map((country) => {
  const countryInfo = {
    name: getCountryDisplayName.of(country),
    callingCode: getCountryCallingCode(country)
  }

  return [country, countryInfo]
}))

export const normalizeCountry = (country) => {
  return typeof country === 'string' && country.length === 2 ? country.toUpperCase() : undefined
}

export const isSupportedCountry = (country) => {
  return typeof country === 'string' && countries.includes(country)
}

export const getCountriesByCallingCode = (callingCode) => {
  const result = []

  Object.entries(countriesMap).forEach(([code, country]) => {
    if (country.callingCode === callingCode) result.push(code)
  })

  return result
}

export const parseNumber = (number) => {
  if (typeof number !== 'string' || number.trim() === '') {
    return undefined
  }

  const asYouType = new AsYouType()
  asYouType.input(number)

  const parsedNumber = asYouType.getNumber()
  if (!parsedNumber) {
    return undefined
  }

  const country = parsedNumber.country
  const mask = getNationalMask(country)
  const nationalNumber = parsedNumber.nationalNumber
  const isValid = parsedNumber.isValid()
  let possibleCountries = parsedNumber.getPossibleCountries()

  // PhoneNumber.getPossibleCountries() doesn't give you possible options when only PhoneNumber.callingCode presented
  if (possibleCountries.length === 0) {
    possibleCountries = getCountriesByCallingCode(parsedNumber.countryCallingCode)
  }

  return { country, mask, possibleCountries, nationalNumber, isValid }
}

export const validateNumberForCountry = (phoneNumberString, country) => {
  try {
    const parsedNumber = parsePhoneNumber(phoneNumberString, { defaultCountry: country, extract: false })

    if (parsedNumber.country === undefined) return 'INVALID'
    if (parsedNumber.country !== country) return 'ANOTHER_COUNTRY'
    if (!parsedNumber.isPossible()) return 'TOO_SHORT'
  } catch (error) {
    if (error instanceof ParseError) return error.message
    else throw error
  }
}

// AsYouType.getTemplate() doesn't fit because it can give template with or without calling code and +
export const getNationalMask = (country) => {
  if (!country) return undefined

  const phone = getExampleNumber(country, examples)
  const national = phone.format('NATIONAL').split(/\d/g)

  const maskLength = phone.nationalNumber.length
  const nationalLength = national.length
  const maskStart = Math.max(0, nationalLength - maskLength - 1)

  const mask = national.slice(maskStart).join('#').trim()
  return mask
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
