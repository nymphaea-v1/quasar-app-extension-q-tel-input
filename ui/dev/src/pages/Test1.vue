<template>
  <q-page padding class="column items-center">
    <h5>Test q-tel-input:</h5>
    <q-tel-input  v-model="phone" v-bind="inputProps" style="width: 300px;" />
    <div class="row q-gutter" style="width: 500px;">
      <p class="text-body1 q-ma-none col-2 text-right">Value:</p>
      <p class="col-10 q-pl-md">{{ phone }}</p>

      <p class="text-body1 q-ma-none col-2 text-right">Options:</p>
      <div class="col-10 q-pl-md">
        <q-checkbox v-model="inputProps.outlined" label="outlined" />
        <q-checkbox v-model="inputProps.dense" label="dense" />
        <q-checkbox v-model="inputProps.filled" label="filled" />
        <q-checkbox v-model="inputProps.borderless" label="borderless" />
        <q-checkbox v-model="inputProps.rounded" label="rounded" />
      </div>

      <p class="text-body1 q-ma-none col-2 text-right">Label:</p>
      <q-input class="col-10 q-pl-md" :model-value="inputProps.label" :hint="LABEL_HINT" dense @update:model-value="updateLabel"></q-input>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const phone = ref('+12345678900')
const inputProps = ref({
  outlined: false,
  dense: false,
  filled: false,
  borderless: false,
  rounded: false,
  label: undefined
})

const updateLabel = (value) => {
  inputProps.value.label = value === '' ? undefined : value
}

const LABEL_HINT = 'Label shifts national number. IMHO it looks pretty bad and fixing it in my TODO list'
</script>
