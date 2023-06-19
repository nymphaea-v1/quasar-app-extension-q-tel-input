<template>
  <q-btn-dropdown
    unelevated
    dense
    square
    class="full-height"
  >
    <template #label>
      <div
        class="row items-center no-wrap relative-position"
        style="right: -8px;"
      >
        <country-flag
          v-bind="FLAG_PROPS"
          :country="selectedCountry"
        />
        <span class="q-pl-sm">{{ selectedCallingCode }}</span>
      </div>
    </template>
    <template #default>
      <q-list>
        <q-item
          v-for="{ country, label } in countryList"
          :key="country"
          v-close-popup
          :dense="dense"
          clickable
          class="row items-center no-wrap"
          @click="selectCountry(country)"
        >
          <country-flag
            v-bind="FLAG_PROPS"
            :country="country"
          />
          <span class="q-pl-sm text-no-wrap">
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
  dense: {
    type: Boolean,
    default: false
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

const FLAG_PROPS = {
  size: 'small',
  style: 'transform: scale(0.36); margin-top: -1em;'
}
</script>
