<template>
  <q-input
    ref="inputElement"
    v-bind="$props"
    :model-value="nationalNumber"
    :rules="[checkValid]"
    :mask="mask"
    unmasked-value
    fill-mask
    class="q-tel-input"
    :class="inputModifierClasses"
    @update:model-value="updateNationalNumber"
    @paste="processPasted"
  >
    <template #prepend>
      <q-country-code-select
        v-bind="dropdownProps"
        :model-value="country"
        :search="search"
        :country-list="validatedCountryList"
        :readonly="readonly"
        class="q-tel-input__select"
        @update:model-value="updateCountry"
      />
    </template>

    <template
      v-for="(_, slot) of $slots"
      #[slot]
    >
      <slot :name="slot" />
    </template>
  </q-input>
</template>

<script setup>
import { QInput } from 'quasar'
import QCountryCodeSelect from './QCountryCodeSelect.vue'

import { ref, computed, watch, nextTick } from 'vue'

import {
  splice,
  extractDigits,
  parseNumber,
  countriesMap,
  normalizeCountry,
  isSupportedCountry,
  getNationalMask,
  validateNumberForCountry,
  LostSymbolsBuffer
} from './utils'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  defaultCountry: {
    type: String,
    default: undefined,
    validator: (value) => {
      return isSupportedCountry(normalizeCountry(value))
    }
  },
  countryList: {
    type: Array,
    default: undefined,
    validator: (value) => {
      return Array.isArray(value) && value.every(value => isSupportedCountry(normalizeCountry(value)))
    }
  },
  strictness: {
    type: String,
    default: 'FULL',
    validator: (value) => {
      if (typeof value !== 'string') return false
      return ['NONE', 'LENGTH', 'FULL', 'CUSTOM'].includes(value.toUpperCase())
    }
  },
  validateFn: {
    type: Function,
    default: () => undefined
  },
  lostSymbolsMaxLength: {
    type: Number,
    default: 10
  },
  dropdownProps: {
    type: Object,
    default: undefined
  },
  search: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  outlined: {
    type: Boolean,
    default: false
  },
  filled: {
    type: Boolean,
    default: false
  },
  rounded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:country'])

const validatedDefaultCountry = computed(() => {
  return normalizeCountry(props.defaultCountry)
})

const validatedCountryList = computed(() => {
  if (!Array.isArray(props.countryList)) return undefined

  const result = []
  props.countryList.forEach((country) => {
    country = normalizeCountry(country)
    if (isSupportedCountry(country)) result.push(country)
  })

  return result
})

const FALLBACK_COUNTRY = 'US'

const fallbackCountry = computed(() => {
  if (validatedDefaultCountry.value) {
    return validatedDefaultCountry.value
  }

  if (validatedCountryList.value !== undefined && validatedCountryList.value.length !== 0) {
    return validatedCountryList.value[0]
  }

  return FALLBACK_COUNTRY
})

const inputElement = ref()
const nationalNumber = ref()
const country = ref(fallbackCountry.value)
const lostSymbols = ref(new LostSymbolsBuffer(props.lostSymbolsMaxLength))

const callingCode = computed(() => {
  const countryInfo = countriesMap[country.value]
  return countryInfo ? countryInfo.callingCode : undefined
})

const number = computed(() => {
  if (!nationalNumber.value) return ''
  if (callingCode.value === undefined) return nationalNumber.value
  return `+${callingCode.value}${nationalNumber.value}`
})

const mask = computed(() => getNationalMask(country.value))
const maskLength = computed(() => mask.value && mask.value.match(/#/g).length)

const manageNationalNumberLength = () => {
  const currentNumber = nationalNumber.value
  if (!currentNumber) {
    lostSymbols.value.reset()
    return
  }

  const length = currentNumber.length
  const difference = maskLength.value ? maskLength.value - length : Infinity

  if (difference < 0) {
    nationalNumber.value = currentNumber.slice(0, difference)
    lostSymbols.value.add(currentNumber.slice(difference))
    return
  }

  if (difference > 0 && lostSymbols.value.buffer.length !== 0) {
    // Use nextTick() here for the same reason as below & to not reset caret position
    nextTick(() => {
      nationalNumber.value = currentNumber + lostSymbols.value.restore(difference)
    })
  }
}

const updateNationalNumberAndCountry = (newCountry, newNationalNumber) => {
  emit('update:country', country.value, newCountry)
  country.value = newCountry

  // Use nextTick() here because QInput behaves weird on mask change, returning the old value
  nextTick(() => {
    lostSymbols.value.reset()
    nationalNumber.value = newNationalNumber
  })
}

const updateNationalNumber = (newNationalNumber) => {
  nationalNumber.value = newNationalNumber
  manageNationalNumberLength()
}

const resetNationalNumber = () => {
  updateNationalNumber('')
}

const updateCountry = (newCountry) => {
  country.value = newCountry
  emit('update:country', newCountry)

  manageNationalNumberLength()
  inputElement.value.validate()
}

const processNumber = (value) => {
  if (!value) {
    resetNationalNumber()
    return
  }

  const parsedNumber = parseNumber(value)
  if (!parsedNumber) {
    updateNationalNumberAndCountry('', extractDigits(value))
    return
  }

  const newCountry = parsedNumber.country || parsedNumber.possibleCountries[0] || fallbackCountry.value
  updateNationalNumberAndCountry(newCountry, parsedNumber.nationalNumber)
}

const processPasted = (event) => {
  if (!event.clipboardData) return

  event.preventDefault()

  const pastedText = event.clipboardData.getData('text')
  const maskedSelectionStart = event.target.selectionStart
  const maskedSelectionEnd = event.target.selectionEnd
  const maskedSelectionLength = maskedSelectionEnd - maskedSelectionStart

  if (mask.value && mask.value.length === maskedSelectionLength) {
    resetNationalNumber()
  }

  if (!nationalNumber.value && pastedText.startsWith('+')) {
    processNumber(pastedText)
    return
  }

  const pastedDigits = extractDigits(pastedText)
  const unmaskedSelectionStart = getUnmaskedIndex(maskedSelectionStart)
  const unmaskedSelectionEnd = getUnmaskedIndex(maskedSelectionEnd)
  const unmaskedSelectionLength = unmaskedSelectionEnd - unmaskedSelectionStart

  const newNationalNumber = splice(nationalNumber.value, pastedDigits, unmaskedSelectionStart, unmaskedSelectionLength)
  const newSelectionPosition = getMaskedIndex(unmaskedSelectionStart + pastedDigits.length)

  updateNationalNumber(newNationalNumber)
  event.target.setSelectionRange(newSelectionPosition, newSelectionPosition)
}

const getMaskedIndex = (unmaskedIndex) => {
  return mask.value
    ? mask.value.split('#').slice(0, unmaskedIndex + 1).join('#').length
    : unmaskedIndex
}

const getUnmaskedIndex = (maskedIndex) => {
  return mask.value
    ? (mask.value.slice(0, maskedIndex).match(/#/g) || []).length
    : maskedIndex
}

watch(() => props.modelValue, (newValue) => {
  if (newValue === number.value) return
  processNumber(newValue)
}, { immediate: true })

watch(number, (newValue) => {
  if (newValue === props.modelValue) return
  emit('update:modelValue', newValue)
}, { flush: 'post' })

const validators = {
  length: () => {
    if (!nationalNumber.value || nationalNumber.value.length < maskLength.value) return 'TOO_SHORT'
    if (nationalNumber.value.length > maskLength.value) return 'TOO_LONG'
  },
  number: () => validateNumberForCountry(number.value, country.value),
  custom: () => {
    const info = {
      number: number.value,
      country: country.value,
      callingCode: callingCode.value,
      nationalNumber: nationalNumber.value
    }

    return props.validateFn(info, validators)
  }
}

const validator = computed(() => {
  if (typeof props.strictness !== 'string') return validators.number

  const strictness = props.strictness.toLowerCase()
  return strictness === 'none' ? () => undefined : validators[strictness] || validators.number
})

const validationStatus = computed(() => validator.value.call())

const checkValid = () => {
  return validationStatus.value === undefined
}

const inputModifierClasses = computed(() => {
  return {
    'q-tel-input--outlined': props.outlined,
    'q-tel-input--filled': props.filled,
    'q-tel-input--rounded': props.rounded
  }
})

defineExpose({
  validationStatus,
  country,
  callingCode,
  nationalNumber
})
</script>
