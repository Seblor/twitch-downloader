<template>
  <b-col class="text-left">
    <b-modal
      style="max-width: 90vw"
      centered
      hide-footer
      hide-header
      :id="'preview-' + uid"
      title="Preview"
      body-class="p-0"
    >
      <img class="w-100" :src="uncachedThumbnail" />
    </b-modal>
    <b-row>
      <b-col :cols="10" class="d-flex">
        <b-button-group size="sm" class="m-2">
          <b-button
            :variant="!data.enabled ? 'success' : 'warning'"
            @click="switchEnabled"
          >
            <b-icon
              :icon="!data.enabled ? 'play' : 'pause'"
              title="Enable auto download"
            />
          </b-button>
          <b-button
            v-if="!data.isDownloading"
            :disabled="!isLive"
            :variant="isLive ? 'success' : 'secondary'"
            @click="forceStart"
            title="Force start download"
          >
            <b-icon icon="play-circle" />
          </b-button>
          <b-button
            v-else
            :disabled="!isLive"
            :variant="isLive ? 'danger' : 'secondary'"
            @click="stopDownload"
          >
            <b-icon icon="stop" />
          </b-button>
          <b-button variant="info" @click="openFolder">
            <b-icon icon="folder2-open" />
          </b-button>
          <b-button variant="danger" @click="remove">
            <b-icon icon="trash" />
          </b-button>
        </b-button-group>
        <h3>
          <a style="cursor: pointer" @click="openWebpage">{{ streamerName }}</a>
        </h3>
      </b-col>
      <b-col :cols="2" class="text-right">
        <b>{{ isLive ? "LIVE" : "OFFLINE" }}</b>
      </b-col>
    </b-row>
    <b-row>
      <b-col :cols="2">
        <a href="#" v-b-modal="'preview-' + uid">
          <img
            :src="uncachedThumbnail"
            class="w-100 m-2"
            style="max-width: 150px"
          />
        </a>
      </b-col>
      <b-col :cols="10">
        {{ data.title }}
      </b-col>
    </b-row>
  </b-col>
</template>

<script>
import { remote } from 'electron'
import { mapActions, mapGetters, mapState } from 'vuex'
import path from 'path'
import fs from 'fs'
import { confirmAction } from '../util/dialogs'
import { STATUS } from '../util/streamlink'

export default {
  data () {
    return {
      uid: Math.floor(Math.random() * 1e8),
      uncachedThumbnail: ''
    }
  },
  props: {
    streamerName: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(['globalLocation']),
    ...mapGetters(['getStreamerData']),
    data () {
      return this.getStreamerData(this.streamerName)
    },
    isLive () {
      return this.data.status === STATUS.ONLINE
    }
  },
  mounted () {
    this.uncachedThumbnail = `${this.data.thumbnail}?${Date.now()}`
    setInterval(() => {
      this.uncachedThumbnail = `${this.data.thumbnail}?${Date.now()}`
    }, 60e3)
  },
  methods: {
    ...mapActions([
      'removeStreamer',
      'enableStreamer',
      'skipCurrent',
      'startCurrent'
    ]),
    openFolder () {
      const dir = path.join(this.globalLocation, this.streamerName)
      if (fs.existsSync(dir)) {
        remote.shell.openPath(dir)
      }
    },
    switchEnabled () {
      this.enableStreamer({
        streamer: this.streamerName,
        enable: !this.data.enabled
      })
    },
    stopDownload () {
      this.skipCurrent(this.streamerName)
    },
    forceStart () {
      this.startCurrent(this.streamerName)
    },
    async remove () {
      if (
        await confirmAction(
          'Are you sure you want to remove this streamer from the list ?'
        )
      ) {
        this.removeStreamer(this.streamerName)
      }
    },
    openWebpage () {
      remote.shell.openExternal('https://www.twitch.tv/' + this.streamerName)
    }
  }
}
</script>

<style>
.modal-lg {
  max-width: 75vw !important;
}

.modal-dialog {
  max-width: 75vw !important;
}
</style>
