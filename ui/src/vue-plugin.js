import QTelInput from './components/QTelInput.vue'

const version = __UI_VERSION__

function install (app) {
  // TODO: Find out why QTelInput.name is undefined (as far as I know SFC should infer its name from filename)
  app.component('QTelInput', QTelInput)
}

export {
  version,
  QTelInput,
  install
}
