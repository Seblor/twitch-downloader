<template>
  <b-container fluid>
    <b-row class="list-group-item item rounded-top d-flex">
      <b-input-group prepend="Download location" class="m-2 text-left">
        <b-form-input v-model="location" placeholder="" />
        <b-input-group-append>
          <b-button variant="info" @click="browseGlobalDir">Browse</b-button>
        </b-input-group-append>
      </b-input-group>
      <b-input-group prepend="Add new" class="m-2">
        <b-form-input
          placeholder="Write a streamer name here and press Enter"
          class="text-center w-50"
          @keypress.enter="addNewStreamer"
        />
      </b-input-group>
    </b-row>
    <draggable
      class="list-group"
      tag="ul"
      v-model="list"
      v-bind="dragOptions"
      @start="drag = true"
      @end="drag = false"
      handle=".handle"
    >
      <transition-group type="transition" :name="!drag ? 'flip-list' : null">
        <li
          class="list-group-item p-0"
          v-for="element in list"
          :key="element.order"
        >
          <!-- <b-icon icon="arrows-expand" class="float-left handle position-absolute mt-1 ml-3" style="left: 0"></b-icon> -->
          <streamer :streamerName="element.name" />
        </li>
      </transition-group>
    </draggable>
  </b-container>
</template>

<script>
import { remote } from 'electron'
import draggable from 'vuedraggable'
import { mapActions, mapGetters, mapState } from 'vuex'
import Streamer from './Streamer.vue'

export default {
  name: 'StreamersList',
  components: {
    draggable,
    Streamer
  },
  data () {
    return {
      list: [],
      drag: false
    }
  },
  mounted () {
    this.list = this.streamersListOrdered.map((name, index) => {
      return { name, order: index + 1 }
    })
  },
  watch: {
    streamersListOrdered () {
      this.list = this.streamersListOrdered.map((name, index) => {
        return { name, order: index + 1 }
      })
    }
  },
  computed: {
    ...mapState(['globalLocation']),
    ...mapGetters(['streamersListOrdered']),
    dragOptions () {
      return {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost'
      }
    },
    location: {
      get () {
        return this.globalLocation
      },
      set (value) {
        this.changeLocation(value)
      }
    }
  },
  methods: {
    ...mapActions(['changeLocation', 'addStreamer']),
    browseGlobalDir () {
      remote.dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        this.location = result.filePaths[0]
      })
    },
    addNewStreamer ({ target }) {
      this.addStreamer(target.value)
      target.value = ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.button {
  margin-top: 35px;
}
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.list-group {
  min-height: 20px;
}
.list-group-item .handle {
  cursor: move;
}
.list-group-item i {
  cursor: pointer;
}
</style>
