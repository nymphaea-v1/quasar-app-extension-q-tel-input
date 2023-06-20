<template>
  <q-input
    ref="inputElement"
    v-bind="$props"
    v-model="nationalNumber"
    :rules="[checkValid]"
    :mask="mask"
    unmasked-value
    fill-mask
    class="q-tel-input"
    :class="inputModifierClasses"
  >
    <template #prepend>
      <q-country-code-select
        v-bind="dropdownProps"
        v-model="country"
        :country-list="validatedCountryList"
        :dense="dense"
        class="q-tel-input__select"
        @update:model-value="inputElement.validate()"
      />
    </template>
  </q-input>
</template>

<script setup>
import { QInput } from 'quasar'
import QCountryCodeSelect from './QCountryCodeSelect.vue'

import { ref, computed, watch } from 'vue'

import {
  proceedNumber,
  countriesMap,
  normalizeCountry,
  isSupportedCountry,
  getNationalMask,
  validateNumberForCountry,
  validateNumberLengthForCountry
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
      return ['NONE', 'LENGTH', 'FULL'].includes(value)
    }
  },
  outlined: {
    type: Boolean,
    default: false
  },
  dense: {
    type: Boolean,
    default: false
  },
  dropdownProps: {
    type: Object,
    default: undefined
  }
})

const emit = defineEmits(['update:modelValue'])

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

const country = ref(fallbackCountry.value)
const nationalNumber = ref()

const callingCode = computed(() => countriesMap[country.value].callingCode)
const number = computed(() => `+${callingCode.value}${nationalNumber.value || ''}`)

const inputElement = ref()
const mask = computed(() => getNationalMask(country.value))

const validationStatus = computed(() => {
  switch (props.strictness) {
    case 'LENGTH':
      return validateNumberLengthForCountry(number.value, country.value)
    case 'FULL':
      return validateNumberForCountry(number.value, country.value)
  }

  return undefined
})

const checkValid = () => validationStatus.value === undefined

watch(() => props.modelValue, (newValue) => {
  if (newValue === number.value) return

  const proceededNumber = proceedNumber(newValue)
  if (!proceededNumber) return

  nationalNumber.value = proceededNumber.nationalNumber
  country.value = proceededNumber.country ||
    proceededNumber.possibleCountries[0] ||
    fallbackCountry.value
}, { immediate: true })

watch(number, (newValue) => {
  if (newValue === props.modelValue) return
  emit('update:modelValue', newValue)
})

const inputModifierClasses = computed(() => {
  return {
    'q-tel-input--outlined': props.outlined
  }
})
</script>
