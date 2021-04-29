<template>
  <div id="app">
    <b-overlay :show="isInstallingStreamlink" class="h-100 m-0" no-fade>
      <router-view />
      <template #overlay class="w-100">
        <h2>{{installStep}}</h2>
        <br>
        <p>{{installProcess}}</p>
      </template>
    </b-overlay>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { checkStreamlinkVersion, updateStreamlink } from './util/streamlink'
export default {
  data () {
    return {
      isInstallingStreamlink: true,
      installStep: 'Checking for updates',
      installProcess: ''
    }
  },
  async mounted () {
    if (await checkStreamlinkVersion()) {
      await updateStreamlink((data) => {
        this.installStep = data.step
        this.installProcess = data.process
      })
    }
    this.initWatcher()

    this.isInstallingStreamlink = false
  },
  methods: {
    ...mapActions(['initWatcher', 'changeLocation', 'addStreamer'])
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

button:disabled {
  cursor: not-allowed;
  pointer-events: all !important;
}
</style>
