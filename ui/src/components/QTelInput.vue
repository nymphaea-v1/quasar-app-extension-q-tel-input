<template>
  <q-input
    v-bind="$props"
    ref="inputElement"
    v-model="nationalNumber"
    :rules="[checkValid]"
    :mask="mask"
    unmasked-value
    fill-mask
  >
    <template #prepend>
      <q-tel-input-country-dropdown
        v-model="country"
        :country-list="countryList"
        :dense="dense"
        :style="dropdownStyles"
        @update:model-value="inputElement.validate()"
      />
    </template>
  </q-input>
</template>

<script setup>
import { QInput } from 'quasar'
import QTelInputCountryDropdown from './QTelInputCountryDropdown.vue'

import { ref, computed, watch } from 'vue'

import { proceedNumber, countriesMap, isValidPhoneNumberForCountry, getNationalMask } from './utils'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  defaultCountry: {
    type: String,
    default: undefined
  },
  countryList: {
    type: Array,
    default: undefined
  },
  outlined: {
    type: Boolean,
    default: false
  },
  dense: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const FALLBACK_COUNTRY = 'US'
const fallbackCountry = computed(() => {
  if (props.defaultCountry) return props.defaultCountry
  if (Array.isArray(props.countryList) && props.countryList.length !== 0) return props.countryList[0]
  return FALLBACK_COUNTRY
})

const country = ref(fallbackCountry.value)
const nationalNumber = ref()

const callingCode = computed(() => countriesMap[country.value].callingCode)
const number = computed(() => `+${callingCode.value}${nationalNumber.value || ''}`)

const inputElement = ref()
const checkValid = () => isValidPhoneNumberForCountry(number.value, country.value)
const mask = computed(() => getNationalMask(country.value))

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

const dropdownStyles = computed(() => {
  const gap = props.dense ? 4 : 10

  const marginLeft = `${props.outlined ? -12 - gap : -gap}px`
  const paddingLeft = props.outlined ? `${gap}px` : undefined
  const right = `${-gap}px`

  return { marginLeft, paddingLeft, right }
})
</script>
