<template>
  <q-page
    padding
    class="column items-center"
  >
    <h5>Test q-tel-input:</h5>

    <q-tel-input
      ref="element"
      v-model="phone"
      v-bind="inputProps"
      style="width: 300px;"
    />

    <div
      class="row q-gutter items-baseline"
      style="width: 500px;"
    >
      <p class="text-body1 q-ma-none col-2 text-right">
        Value:
      </p>
      <p class="col-10 q-pl-md">
        {{ phone }}
      </p>

      <p class="text-body1 q-ma-none col-2 text-right">
        Exposed:
      </p>
      <p class="col-10 q-pl-md">
        {{ element }}
      </p>

      <p class="text-body1 q-ma-none col-2 text-right">
        Strictness:
      </p>
      <div class="col-10 q-pl-md">
        <q-radio
          v-for="(value, index) in STRICTNESS"
          :key="index"
          v-model="inputProps.strictness"
          :val="value"
          :label="value"
        />
      </div>

      <p class="text-body1 q-ma-none col-2 text-right">
        Options:
      </p>
      <div class="col-10 q-pl-md">
        <q-checkbox
          v-for="(option, index) in TOGGLE_OPTIONS"
          :key="index"
          v-model="inputProps[option]"
          :label="option"
        />
      </div>

      <p class="text-body1 q-ma-none col-2 text-right">
        Label:
      </p>
      <q-input
        class="col-10 q-pl-md"
        :model-value="inputProps.label"
        :hint="LABEL_HINT"
        dense
        @update:model-value="updateLabel"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const phone = ref('+12345678900')
const element = ref()

const TOGGLE_OPTIONS = [
  'outlined',
  'dense',
  'filled',
  'borderless',
  'rounded',
  'search'
]

const STRICTNESS = [
  'NONE',
  'LENGTH',
  'FULL'
]

const inputProps = ref({
  label: undefined,
  strictness: 'FULL'
})

onMounted(() => {
  TOGGLE_OPTIONS.forEach((option) => (inputProps.value[option] = false))
})

const LABEL_HINT = 'Label shifts national number. IMHO it looks pretty bad and fixing it in my TODO list'

const updateLabel = (value) => {
  inputProps.value.label = value === '' ? undefined : value
}
</script>
