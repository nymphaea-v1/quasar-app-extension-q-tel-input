import { boot } from 'quasar/wrappers'
import VuePlugin from 'quasar-ui-q-tel-input'

export default boot(({ app }) => {
  app.use(VuePlugin)
})
