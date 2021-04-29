<template>
  <div class="home">
    <streamers-list msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import StreamersList from '@/components/StreamersList.vue'

export default {
  name: 'Home',
  components: {
    StreamersList
  }
}
</script>
