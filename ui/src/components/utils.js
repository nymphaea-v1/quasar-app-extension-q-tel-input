import examples from 'libphonenumber-js/mobile/examples'
import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  getExampleNumber,
  parsePhoneNumber
} from 'libphonenumber-js/mobile'

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

export const isValidPhoneNumberForCountry = (phoneNumberString, country) => {
  let phoneNumber
  try {
    phoneNumber = parsePhoneNumber(phoneNumberString, { defaultCountry: country, extract: false })
  } catch (_) {}

  return !!phoneNumber && phoneNumber.country === country && phoneNumber.isValid()
}

// AsYouType.getTemplate() doesn't fit because it can give template with or without calling code and +
export const getNationalMask = (country) => {
  const phone = getExampleNumber(country, examples)
  const mask = phone.format('NATIONAL', { nationalPrefix: false }).replaceAll(/\d/g, '#')

  return mask
}
