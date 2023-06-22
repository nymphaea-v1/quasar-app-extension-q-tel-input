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
        :model-value="country"
        :search="search"
        :country-list="validatedCountryList"
        :readonly="readonly"
        class="q-tel-input__select"
        @update:model-value="onCountryChange"
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

import { ref, computed, watch } from 'vue'

import {
  proceedNumber,
  countriesMap,
  normalizeCountry,
  isSupportedCountry,
  getNationalMask,
  validateNumberForCountry
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
const mask = ref()

const callingCode = computed(() => countriesMap[country.value].callingCode)
const number = computed(() => `+${callingCode.value}${nationalNumber.value || ''}`)
const validLength = computed(() => mask.value.match(/#/g).length)

const validators = {
  length: () => {
    if (!nationalNumber.value || nationalNumber.value.length < validLength.value) return 'TOO_SHORT'
    if (nationalNumber.value.length > validLength.value) return 'TOO_LONG'
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
  const strictness = props.strictness?.toLowerCase()
  return strictness === 'none' ? undefined : validators[strictness] ?? validators.number
})

const validationStatus = computed(() => validator.value?.call())
const checkValid = () => (validationStatus.value === undefined)

watch(() => props.modelValue, (newValue) => {
  if (newValue === number.value) return

  const proceededNumber = proceedNumber(newValue)
  if (!proceededNumber) return

  mask.value = proceededNumber.mask
  nationalNumber.value = proceededNumber.nationalNumber
  country.value = proceededNumber.country ||
    proceededNumber.possibleCountries[0] ||
    fallbackCountry.value
}, { immediate: true })

watch(number, (newValue) => {
  if (newValue === props.modelValue) return
  emit('update:modelValue', newValue)
})

const onCountryChange = (value) => {
  const oldCountry = country.value

  country.value = value
  mask.value = getNationalMask(value)
  inputElement.value.validate()

  emit('update:country', { old: oldCountry, new: value })
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
