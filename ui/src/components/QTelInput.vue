<template>
  <q-input
    ref="inputElement"
    v-bind="$props"
    :model-value="nationalNumber"
    :rules="[checkValid]"
    lazy-rules="ondemand"
    :mask="mask"
    unmasked-value
    fill-mask
    class="q-tel-input"
    :class="inputModifierClasses"
    @update:model-value="updateNationalNumber"
    @beforeinput="verifyPossible"
    @paste="processPasted"
  >
    <template #prepend>
      <q-country-code-select
        v-bind="dropdownProps"
        :model-value="country"
        :country-list="validatedCountryList"
        :locales="locales"
        :get-item-label="getDropdownItemLabel"
        :search="search"
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
  isDigit,
  extractDigits,
  parseNumber,
  countryCallingCodesMap,
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
  locales: {
    type: [String, Array],
    default: undefined
  },
  getDropdownItemLabel: {
    type: Function,
    default: undefined
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
const callingCode = computed(() => countryCallingCodesMap[country.value])

const number = computed(() => {
  if (!nationalNumber.value) return ''
  if (callingCode.value === undefined) return nationalNumber.value
  return `+${callingCode.value}${nationalNumber.value}`
})

const mask = computed(() => getNationalMask(country.value))
const maskLength = computed(() => mask.value && mask.value.match(/#/g).length)

const lostSymbols = ref(new LostSymbolsBuffer(props.lostSymbolsMaxLength))

const triggerValidation = () => {
  inputElement.value.validate()
}

const manageNationalNumberLength = () => {
  const currentNumber = nationalNumber.value || ''
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

const updateNationalNumberAndCountry = (newCountry, newNationalNumber, triggerValidate = true) => {
  emit('update:country', country.value, newCountry)
  country.value = newCountry

  // Use nextTick() here because QInput behaves weird on mask change, returning the old value
  nextTick(() => {
    nationalNumber.value = newNationalNumber || ''

    lostSymbols.value.reset()
    if (triggerValidate) triggerValidation()
  })
}

const updateNationalNumber = (newNationalNumber, triggerValidate = true) => {
  nationalNumber.value = newNationalNumber || ''

  manageNationalNumberLength()
  if (triggerValidate) triggerValidation()
}

const resetNationalNumber = (triggerValidate) => {
  updateNationalNumber('', triggerValidate)
}

const updateCountry = (newCountry, triggerValidate = true) => {
  country.value = newCountry
  emit('update:country', newCountry)

  manageNationalNumberLength()
  if (triggerValidate) triggerValidation()
}

const processNumber = (value, triggerValidate = false) => {
  if (!value) {
    resetNationalNumber(triggerValidate)
    return
  }

  const parsedNumber = parseNumber(value)
  if (!parsedNumber) {
    updateNationalNumberAndCountry('', extractDigits(value), triggerValidate)
    return
  }

  const newCountry = parsedNumber.country || parsedNumber.possibleCountries[0] || fallbackCountry.value
  updateNationalNumberAndCountry(newCountry, parsedNumber.nationalNumber, triggerValidate)
}

const processPasted = (event) => {
  if (!event.clipboardData) return

  event.preventDefault()

  const pastedText = event.clipboardData.getData('text')
  const unmaskedSelectionStart = getUnmaskedIndex(event.target.selectionStart)
  const unmaskedSelectionEnd = getUnmaskedIndex(event.target.selectionEnd)
  const unmaskedSelectionLength = unmaskedSelectionEnd - unmaskedSelectionStart

  if (nationalNumber.value && nationalNumber.value.length <= unmaskedSelectionLength) {
    resetNationalNumber()
  }

  if (!nationalNumber.value && pastedText.startsWith('+')) {
    const pastedNumber = `+${extractDigits(pastedText)}`
    processNumber(pastedNumber, true)
    return
  }

  const pastedDigits = extractDigits(pastedText)
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

const verifyPossible = (event) => {
  if (!event.data) return

  if (!maskLength.value) {
    if (!isDigit(event.data)) event.preventDefault()
    return
  }

  if (!nationalNumber.value) return

  const selectionLength = getUnmaskedIndex(event.target.selectionEnd) - getUnmaskedIndex(event.target.selectionStart)
  const freeLength = maskLength.value - (nationalNumber.value.length - selectionLength)
  const dataLength = event.data.length

  if (freeLength < dataLength) event.preventDefault()
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
