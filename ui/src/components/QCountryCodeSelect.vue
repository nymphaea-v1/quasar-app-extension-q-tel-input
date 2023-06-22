<template>
  <q-btn-dropdown
    unelevated
    dense
    square
    class="q-country-code-select"
    :class="{ 'q-country-code-select--readonly': readonly }"
  >
    <template #label>
      <div class="q-country-code-select__selected q-country-code-option">
        <country-flag
          size="small"
          :country="selectedCountry ?? 'KZ'"
          class="q-country-code-option__flag q-country-code-option__flag--basic"
          :class="{'q-country-code-option__flag--unknown': selectedCountry === undefined }"
        />
        <span class="q-country-code-option__label">{{ selectedCallingCode }}</span>
      </div>
    </template>
    <template #default>
      <q-list class="q-country-code-select__options">
        <q-item
          v-if="search"
          class="q-country-code-select__search"
        >
          <q-input
            v-model="filterString"
            autofocus
            dense
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-item>
        <q-item
          v-for="{ country, label } in filteredCountryList"
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
import { QBtnDropdown, QItem, QList, QInput, QIcon, ClosePopup as vClosePopup } from 'quasar'

import { computed, ref } from 'vue'
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
  },
  search: {
    type: Boolean,
    default: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const processedCountryList = computed(() => {
  const result = []

  props.countryList.forEach((country) => {
    const countryInfo = countriesMap[country]
    if (!countryInfo) return

    const label = props.getItemLabel(country, countryInfo.callingCode, countryInfo.name)
    result.push({ label, country, ...countryInfo })
  })

  return result
})

const filterString = ref('')
const filteredCountryList = computed(() => processedCountryList.value.filter(({ label }) => {
  const countryName = label.toLowerCase()
  const needle = filterString.value.toLowerCase()

  return countryName.indexOf(needle) >= 0
}))

const selectedCountry = computed({
  get: () => countriesMap[props.modelValue] ? props.modelValue : undefined,
  set: (value) => emit('update:modelValue', value)
})

const selectedCallingCode = computed(() => {
  if (selectedCountry.value === undefined) return undefined

  const country = selectedCountry.value.toUpperCase()
  return country in countriesMap ? `+${countriesMap[country].callingCode}` : undefined
})

const selectCountry = (country) => {
  selectedCountry.value = country
}
</script>
