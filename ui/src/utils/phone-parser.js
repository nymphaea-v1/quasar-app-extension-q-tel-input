import examples from 'libphonenumber-js/mobile/examples'
import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  getExampleNumber,
  parsePhoneNumber,
  ParseError
} from 'libphonenumber-js'

export const countries = getCountries()

export const countryCallingCodesMap = Object.fromEntries(countries.map((country) => {
  return [country, getCountryCallingCode(country)]
}))

export const normalizeCountry = (country) => {
  return typeof country === 'string' && country.length === 2 ? country.toUpperCase() : undefined
}

export const isSupportedCountry = (country) => {
  return typeof country === 'string' && country in countryCallingCodesMap
}

export const getCountriesByCallingCode = (callingCode) => {
  const result = []

  Object.entries(countryCallingCodesMap).forEach(([code, entryCallingCode]) => {
    if (entryCallingCode === callingCode) result.push(code)
  })

  return result
}

export const parseCallingCode = (value) => {
  if (typeof value !== 'string' || !value.startsWith('+')) return undefined

  const callingCode = value.slice(1)
  const possibleCountries = getCountriesByCallingCode(callingCode)

  return possibleCountries.length === 0
    ? undefined
    : { callingCode, possibleCountries }
}

export const parseNumber = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }

  const asYouType = new AsYouType()
  asYouType.input(value)

  const parsedNumber = asYouType.getNumber()
  if (!parsedNumber) {
    const parsedCallingCode = parseCallingCode(value)
    if (!parsedCallingCode) return undefined

    return {
      possibleCountries: parsedCallingCode.possibleCountries,
      nationalNumber: ''
    }
  }

  let possibleCountries = parsedNumber.getPossibleCountries()
  if (possibleCountries.length === 0) {
    // PhoneNumber.getPossibleCountries() doesn't give you possible options when only PhoneNumber.callingCode present
    possibleCountries = getCountriesByCallingCode(parsedNumber.countryCallingCode)
    if (possibleCountries.length === 0) return undefined
  }

  const country = parsedNumber.country
  const nationalNumber = parsedNumber.nationalNumber

  return { country, possibleCountries, nationalNumber }
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

export const formatNumber = (number, emptyDigit = '#') => {
  const parsedNumber = parseNumber(number)
  if (!parsedNumber) return number

  const country = parsedNumber.country || parsedNumber.possibleCountries[0]
  const mask = getNationalMask(country)
  const numberDigits = parsedNumber.nationalNumber.split('')

  return `+${countryCallingCodesMap[country]} ${mask.replaceAll('#', () => numberDigits.shift() || emptyDigit)}`
}
