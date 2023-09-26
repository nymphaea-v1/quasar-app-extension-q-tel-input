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
          :country="selectedCountry || 'KZ'"
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

import { countries, countryCallingCodesMap, isSupportedCountry, normalizeCountry } from './utils'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  countryList: {
    type: Array,
    default: () => countries
  },
  locales: {
    type: [String, Array],
    default: () => []
  },
  getItemLabel: {
    type: Function,
    default: (_code, callingCode, name) => `${name} +${callingCode}`
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
  const getCountryDisplayName = new Intl.DisplayNames(props.locales, { type: 'region' })
  const result = []

  props.countryList.forEach((country) => {
    if (!isSupportedCountry(country)) return

    const name = getCountryDisplayName.of(country)
    const callingCode = countryCallingCodesMap[country]
    const label = props.getItemLabel(country, callingCode, name)

    result.push({ country, name, callingCode, label })
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
  get: () => {
    const country = normalizeCountry(props.modelValue)
    return isSupportedCountry(country) ? country : undefined
  },
  set: (value) => emit('update:modelValue', value)
})

const selectedCallingCode = computed(() => {
  return selectedCountry.value
    ? `+${countryCallingCodesMap[selectedCountry.value]}`
    : undefined
})

const selectCountry = (country) => {
  selectedCountry.value = country
}
</script>
