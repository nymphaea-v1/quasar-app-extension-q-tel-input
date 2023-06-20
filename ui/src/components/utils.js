import examples from 'libphonenumber-js/mobile/examples'
import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  getExampleNumber,
  parsePhoneNumber,
  ParseError
} from 'libphonenumber-js'

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

export const proceedNumber = (number) => {
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
  const nationalNumber = parsedNumber.nationalNumber
  const isValid = parsedNumber.isValid()
  let possibleCountries = parsedNumber.getPossibleCountries()

  // PhoneNumber.getPossibleCountries() doesn't give you possible options when only PhoneNumber.callingCode presented
  if (possibleCountries.length === 0) {
    possibleCountries = getCountriesByCallingCode(parsedNumber.countryCallingCode)
  }

  return { country, possibleCountries, nationalNumber, isValid }
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
  const phone = getExampleNumber(country, examples)
  const mask = phone.format('NATIONAL', { nationalPrefix: false }).replaceAll(/\d/g, '#')

  return mask
}
