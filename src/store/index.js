import { remote } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import { downloadStream, getStreamerStatus, STATUS } from '../util/streamlink'
import path from 'path'
import terminate from 'terminate'

Vue.use(Vuex)

/**
 * @type {import('../../node_modules/vuex/types/index').Store}
 */
const store = new Vuex.Store({
  plugins: [createPersistedState({ key: 'twitch-downloader' })],
  state: {
    globalLocation: remote.app.getPath('videos'),
    streamers: {}
  },
  getters: {
    getStreamerData (state) {
      return streamer => state.streamers[streamer]
    },
    streamersList (state) {
      return Object.keys(state.streamers)
    },
    streamersListOrdered (state) {
      return Object.keys(state.streamers).sort((a, b) => {
        return (state.streamers[a].status === STATUS.ONLINE &&
        state.streamers[b].status === STATUS.OFFLINE) ? -1 : 1
      })
    }
  },
  mutations: {
    addStreamer (state, streamer) {
      Vue.set(state.streamers, streamer, {
        enabled: true,
        status: STATUS.OFFLINE,
        skipCurrent: false,
        isDownloading: false,
        title: 'Fetching...',
        thumbnail: 'https://static-cdn.jtvnw.net/ttv-static/404_preview-1280x720.jpg'
      })
    },
    enableStreamer (state, { streamer, enable }) {
      Vue.set(state.streamers[streamer], 'enabled', enable)
    },
    changeLocation (state, location) {
      Vue.set(state, 'globalLocation', location)
    },
    changeStatus (state, { streamer, status }) {
      Vue.set(state.streamers[streamer], 'status', status)
    },
    changeTitle (state, { streamer, title }) {
      Vue.set(state.streamers[streamer], 'title', title)
    },
    changeThumbnail (state, { streamer, thumbnail }) {
      Vue.set(state.streamers[streamer], 'thumbnail', thumbnail)
    },
    removeStreamer (state, streamer) {
      Vue.delete(state.streamers, streamer)
    },
    shouldSkipCurrent (state, { streamer, shouldSkip }) {
      Vue.set(state.streamers[streamer], 'skipCurrent', shouldSkip)
    },
    setDownloading (state, { streamer, isDownloading }) {
      Vue.set(state.streamers[streamer], 'isDownloading', isDownloading)
    }
  },
  actions: {
    addStreamer ({ commit, dispatch }, streamer) {
      commit('addStreamer', streamer)
      dispatch('updateStreamerData', streamer)
    },
    enableStreamer ({ commit }, value) {
      commit('enableStreamer', value)
    },
    changeLocation ({ commit }, value) {
      commit('changeLocation', value)
    },
    changeStatus ({ commit }, { streamer, status }) {
      commit('changeStatus', { streamer, status })
    },
    changeTitle ({ commit }, { streamer, title }) {
      commit('changeTitle', { streamer, title })
    },
    changeThumbnail ({ commit }, { streamer, thumbnail }) {
      commit('changeThumbnail', { streamer, thumbnail })
    },
    removeStreamer ({ commit }, streamer) {
      commit('removeStreamer', streamer)
    },
    shouldSkipCurrent ({ commit }, { streamer, shouldSkip }) {
      commit('shouldSkipCurrent', { streamer, shouldSkip })
    },
    skipCurrent ({ commit }, streamer) {
      commit('shouldSkipCurrent', { streamer, shouldSkip: true })
      stopDownload(streamer)
    },
    setDownloading ({ commit }, { streamer, isDownloading }) {
      commit('setDownloading', { streamer, isDownloading })
    },
    startCurrent ({ commit, state }, streamer) {
      commit('shouldSkipCurrent', { streamer, shouldSkip: false })
      startDownload(streamer, state.globalLocation)
    },
    async updateStreamerData ({ dispatch, state }, streamer) {
      try {
        const result = await getStreamerStatus(streamer)
        if (result.status === 'DOES_NOT_EXIST') {
          return dispatch('removeStreamer', streamer)
        }
        if (state.streamers[streamer].status === STATUS.ONLINE && result.status === STATUS.OFFLINE && state.streamers[streamer].enabled) { // If stream changed to offline and is enabled
          await dispatch('shouldSkipCurrent', { streamer, shouldSkip: false })
        }
        if (result.status === 'ONLINE' && state.streamers[streamer].enabled) {
          startDownload(streamer, state.globalLocation)
        }
        dispatch('changeStatus', { streamer, status: result.status })
        dispatch('changeTitle', { streamer, title: result.title })
        dispatch('changeThumbnail', { streamer, thumbnail: result.thumbnail })
      } catch (err) {
        console.log(err)
      }
    },
    initWatcher ({ dispatch, state }) {
      setInterval(async () => {
        Object.keys(state.streamers).forEach(async streamer => {
          dispatch('updateStreamerData', streamer)
        })
      }, 30e3) // Check every 30 seconds

      // Update current status
      Object.keys(state.streamers).forEach(async streamer => {
        dispatch('setDownloading', { streamer, isDownloading: false })
        dispatch('updateStreamerData', streamer)
      })
    }
  },
  modules: {
  }
})

async function startDownload (streamer, globalLocation) {
  if (downloadProcesses[streamer] === undefined) {
    store.dispatch('setDownloading', { streamer, isDownloading: true })
    downloadProcesses[streamer] = await downloadStream(streamer, path.join(globalLocation, streamer))
    downloadProcesses[streamer].promise.then(() => {
      console.log('Stream ended', streamer)
      delete downloadProcesses[streamer]
      store.dispatch('setDownloading', { streamer, isDownloading: false })
    })
  }
  console.log(downloadProcesses[streamer])
  return downloadProcesses[streamer]
}

function stopDownload (streamer) {
  if (downloadProcesses[streamer] !== undefined) {
    terminate(downloadProcesses[streamer].process.pid)
  }
}

const downloadProcesses = {}

export default store
