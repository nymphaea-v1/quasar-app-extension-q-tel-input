import { h } from 'vue'
import { QBadge } from 'quasar'

export default {
  name: 'QTelInput',

  setup () {
    return () => h(QBadge, {
      class: 'QTelInput',
      label: 'QTelInput'
    })
  }
}
