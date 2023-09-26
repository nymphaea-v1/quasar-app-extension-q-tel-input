[![npm](https://img.shields.io/npm/v/quasar-ui-q-tel-input.svg?label=quasar-ui-q-tel-input)](https://www.npmjs.com/package/quasar-ui-q-tel-input)
[![npm](https://img.shields.io/npm/dt/quasar-ui-q-tel-input.svg)](https://www.npmjs.com/package/quasar-ui-q-tel-input)


A simple International Telephone Input component for Quasar.
**Compatible with Quasar UI v2 and Vue 3**.

<div align="center">
  <img src="https://i.imgur.com/etN0Y5C.gif" width="600" alt="Preview GIF"  />
</div>


# Documentation
### Dependencies
- [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) for parsing and validating numbers
- [vue-country-flag-next](https://www.npmjs.com/package/vue-country-flag-next) for country flag icons

### Countries
All countries are represent by their [alfa2 code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). List of all countries is taken from [`getCountries()`](https://gitlab.com/catamphetamine/libphonenumber-js/-/blob/master/README.md#getcountries-string).


## Props
| Name                 | Type            | Required | Default   | Description                                                                                                       |
| -------------------- | --------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| modelValue           | String          | +        | -         | Not formatted international number, e.g. `+7701123456`                                                            |
| defaultCountry       | String          | -        | `US`      | Country that selected by default                                                                                  |
| countryList          | Array           | -        | All       | Available countries in dropdown options list                                                                      |
| strictness           | String          | -        | `FULL`    | Validation strictness. One of `['NONE', 'LENGTH', 'FULL', 'CUSTOM']` (details below)                              |
| locales              | [String, Array] | -        | `[]`      | Locales to use for country names in dropdown list. First parameter of [Intl.DisplayNames constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames/DisplayNames#parameters) |
| getDropdownItemLabel | Function        | -        | In descr. | Returns label for specific country in dropdown. Default: (_code, callingCode, name) => `${name} +${callingCode} ` |
| dropdownProps        | Object          | -        | -         | Props passed to QBtnDropdown                                                                                      |
| search               | Boolean         | -        | `false`   | Toggles searchbar for countries in dropdown                                                                       |

...and props available for [`QInput`](https://quasar.dev/vue-components/input#qinput-api).


## Exposed values
```ts
{
  validationStatus: string | undefined // Error code if in error state
  country: string | undefined
  callingCode: string | undefined // e.g. '7' for KZ
  nationalNumber: string | undefined
}
```

### Possible values for `validationStatus`
- These two errors only occur when country is not set yet (e.g. on initial parse):
    - `INVALID_COUNTRY` - when value passed to input is non-international number or has unknown calling code
    - `NOT_A_NUMBER` - when value passed to input is not a phone number (empty or contains invalid characters e.g. letters)

- Other errors:
    - `TOO_SHORT` - when value is too short
    - `INVALID` - when value is not valid
    - `ANOTHER_COUNTRY` - when country in dropdown differs from parsed


## Validation
`QTelInput` validates value depending on the `strictness`:
- **NONE** - no validation and highlighting at all
- **LENGTH** - validate only length
- **FULL** - validate length and number itself
- **CUSTOM** - custom validation

> Note: `QTelInput` has error state, but doesn't show error message.
> You can get error code from `validationStatus` and set corresponding error message with `errorMessage` `QInput` prop.

### Custom validation
With `strictness="CUSTOM"` you can pass your own validation function `validateFn`:
```js
<q-tel-input
  strictness="CUSTOM"
  :validate-fn="myValidateFunction"
/>
```

Note that `validateFn` can return the same value as functions in `rules` prop for [`QInput`](https://quasar.dev/vue-components/input#qinput-api).
```ts
type validateFn = (data: Data, validators: Validators) => boolean | ERROR_CODE | undefined

interface Data {
  number: string
  country: string
  callingCode: string
  nationalNumber: string
}

interface Validators {
  number: Function, // Used for validation with strictness="FULL"
  length: Function // Used for validation with strictness="LENGTH"
}
```

Example:
```js
// Same as 'FULL' but also allows empty input
const validateFn = (data, validators) => {
  return !data.nationalNumber ? undefined : validators.number()
}
```


# Install
## Quasar CLI project
Install the [App Extension](../app-extension):
```bash
quasar ext add q-tel-input
```
Quasar CLI will retrieve it from NPM and install the extension.

**OR**:

Create and register a boot file:
```js
import Vue from 'vue'
import Plugin from 'quasar-ui-q-tel-input'
import 'quasar-ui-q-tel-input/dist/index.css'

Vue.use(Plugin)
```

**OR**:

```html
<style src="quasar-ui-q-tel-input/dist/index.css"></style>

<script>
import { Component as QTelInput } from 'quasar-ui-q-tel-input'

export default {
  
  components: {
    QTelInput
  }
  
  
}
</script>
```


## Vue CLI project
```js
import Vue from 'vue'
import Plugin from 'quasar-ui-q-tel-input'
import 'quasar-ui-q-tel-input/dist/index.css'

Vue.use(Plugin)
```

**OR**:

```html
<style src="quasar-ui-q-tel-input/dist/index.css"></style>

<script>
import { Component as QTelInput } from 'quasar-ui-q-tel-input'

export default {
  
  components: {
    QTelInput
  }
  
  
}
</script>
```


## UMD variant
Exports `window.qTelInput`.
Add the following tag(s) after the Quasar ones:
```html
<head>
  <!-- AFTER the Quasar stylesheet tags: -->
  <link href="https://cdn.jsdelivr.net/npm/quasar-ui-q-tel-input/dist/index.min.css" rel="stylesheet" type="text/css">
</head>
<body>
  <!-- at end of body, AFTER Quasar script(s): -->
  <script src="https://cdn.jsdelivr.net/npm/quasar-ui-q-tel-input/dist/index.umd.min.js"></script>
</body>
```
If you need the RTL variant of the CSS, then go for the following (instead of the above stylesheet link):
```html
<link href="https://cdn.jsdelivr.net/npm/quasar-ui-q-tel-input/dist/index.rtl.min.css" rel="stylesheet" type="text/css">
```


# Setup
```bash
$ yarn
```


# Developing
```bash
# start dev in SPA mode
$ yarn dev

# start dev in UMD mode
$ yarn dev:umd

# start dev in SSR mode
$ yarn dev:ssr

# start dev in Cordova iOS mode
$ yarn dev:ios

# start dev in Cordova Android mode
$ yarn dev:android

# start dev in Electron mode
$ yarn dev:electron
```


# Building package
```bash
$ yarn build
```


# Adding Testing Components
in the `ui/dev/src/pages` you can add Vue files to test your component/directive. When using `yarn dev` to build the UI, any pages in that location will automatically be picked up by dynamic routing and added to the test page.


# Adding Assets
If you have a component that has assets, like language or icon-sets, you will need to provide these for UMD. In the `ui/build/script.javascript.js` file, you will find a couple of commented out commands that call `addAssets`. Uncomment what you need and add your assets to have them be built and put into the `ui/dist` folder.


# Donate
If you appreciate the work that went into this, please consider [donating to Quasar](https://donate.quasar.dev).


# License
MIT (c) nymphaea-v1
