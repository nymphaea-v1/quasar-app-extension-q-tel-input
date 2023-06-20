<template>
  <q-btn-dropdown
    unelevated
    dense
    square
    class="q-country-code-select"
  >
    <template #label>
      <div class="q-country-code-select__selected q-country-code-option">
        <country-flag
          size="small"
          :country="selectedCountry"
          class="q-country-code-option__flag q-country-code-option__flag--basic"
        />
        <span class="q-country-code-option__label">{{ selectedCallingCode }}</span>
      </div>
    </template>
    <template #default>
      <q-list>
        <q-item
          v-for="{ country, label } in countryList"
          :key="country"
          v-close-popup
          clickable
          dense
          class="q-country-code-select__option q-country-code-option"
          @click="selectCountry(country)"
        >
          <country-flag
            size="small"
            :country="country"
            class="q-country-code-option__flag q-country-code-option__flag--basic"
          />
          <span class="q-country-code-option__label q-pl-sm text-no-wrap">
            {{ label }}
          </span>
        </q-item>
      </q-list>
    </template>
  </q-btn-dropdown>
</template>

<script setup>
import { QBtnDropdown, QItem, QList, ClosePopup as vClosePopup } from 'quasar'

import { computed } from 'vue'
import CountryFlag from 'vue-country-flag-next'

import { countries, countriesMap } from './utils'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  countryList: {
    type: Array,
    default: () => countries
  },
  getItemLabel: {
    type: Function,
    default: (code, callingCode, name) => `${name} +${callingCode}`
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedCountry = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedCallingCode = computed(() => {
  if (typeof selectedCountry.value !== 'string') return undefined

  const country = selectedCountry.value.toUpperCase()
  return country in countriesMap ? `+${countriesMap[country].callingCode}` : undefined
})

const countryList = computed(() => {
  const result = []

  props.countryList.forEach((country) => {
    const countryInfo = countriesMap[country]
    if (!countryInfo) return

    const label = props.getItemLabel(country, countryInfo.callingCode, countryInfo.name)
    result.push({ label, country, ...countryInfo })
  })

  return result
})

const selectCountry = (country) => {
  selectedCountry.value = country
}
</script>
