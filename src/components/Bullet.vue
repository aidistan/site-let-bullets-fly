<template>
  <div class="bullet am-progress">
    <div v-for="(val, key, idx) in bars"
      :class="barClass(idx)" :style="barStyle(val)">{{ key }}</div>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'bullet',
  props: ['bars'],
  methods: {
    barClass (idx) {
      switch (idx % 4) {
        case 1: return 'am-progress-bar am-progress-bar-success'
        case 2: return 'am-progress-bar am-progress-bar-warning'
        case 3: return 'am-progress-bar am-progress-bar-danger'
      }
      return 'am-progress-bar'
    },
    barStyle (val) {
      let sum = _.reduce(this.bars, (res, val) => res + val, 0)
      return { width: (val / sum * 100) + '%' }
    }
  }
}
</script>

<style scoped>
.bullet {
  margin-bottom: 8px;
}
</style>
