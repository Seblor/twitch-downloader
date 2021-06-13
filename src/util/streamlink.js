import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import extract from 'extract-zip'
import SemVer from 'semver'
import os from 'os'
import { https } from 'follow-redirects'

const STORAGE_KEY_STREAMLINK_VERSION = 'TwitchDownloader-streamlinkVersion'
const binFolderLocation = process.env.NODE_ENV === 'development' ? './bin' : './resources/bin'
const lockFilePath = path.join(binFolderLocation, 'download-process.lock')
if (!fs.existsSync(binFolderLocation)) {
  fs.mkdirSync(binFolderLocation)
}

async function fetchLastStreamlinkAsset () {
  const { assets, tag_name: version } = await fetch('https://api.github.com/repos/beardypig/streamlink-portable/releases/latest').then(res => res.json())
  return {
    asset: assets.find(asset => asset.name.includes(os.platform())),
    version
  }
}

/**
 * Update Streamlink (only supported for win32)
 * @param {({step: string, process: string}) => {}} stateChangeCallback
 */
export async function updateStreamlink (stateChangeCallback) {
  const { asset, version } = await fetchLastStreamlinkAsset()
  const assetName = asset.name
  const assetSize = asset.size

  const assetFilePath = path.join(binFolderLocation, assetName)
  const file = fs.createWriteStream(assetFilePath)
  fs.closeSync(fs.openSync(lockFilePath, 'w'))

  return new Promise(resolve => {
    https.get(asset.browser_download_url, (response) => {
      let totalDownloaded = 0
      response.on('data', (chunk) => {
        totalDownloaded += chunk.length
        if (typeof stateChangeCallback === 'function') {
          stateChangeCallback({
            step: 'Downloading Streamlink...',
            process: `${Math.round(100 * totalDownloaded / assetSize)}%`
          })
        }
      })
      response.pipe(file).on('close', () => {
        if (typeof stateChangeCallback === 'function') {
          stateChangeCallback({
            step: 'Extracting Streamlink...',
            process: ''
          })
        }

        // Extracting the archive
        extract(assetFilePath, {
          dir: path.resolve(binFolderLocation),
          onEntry: (entry) => {
            if (typeof stateChangeCallback === 'function') {
              stateChangeCallback({
                step: 'Extracting',
                process: entry.fileName
              })
            }
          }
        }, (err) => {
          if (err) console.error(err)
        }).then(() => {
          fs.unlink(assetFilePath, (err) => { if (err) console.error(err) })
          fs.unlink(lockFilePath, (err) => { if (err) console.error(err) })
          localStorage.setItem(STORAGE_KEY_STREAMLINK_VERSION, version)
          resolve()
        })
      })
    })
  })
}

/**
 * Check Streamlink's latest corresponding asset for the OS
 * @returns {boolean} true if Streamlink should be updated
 */
export async function checkStreamlinkVersion () {
  const installedVersion = localStorage.getItem(STORAGE_KEY_STREAMLINK_VERSION)
  if (!installedVersion || fs.existsSync(lockFilePath)) {
    return true
  }
  const { asset, version } = await fetchLastStreamlinkAsset()

  return asset && SemVer.gt(version, installedVersion)
}

/**
 * @typedef {'ONLINE'|'OFFLINE'|'DOES_NOT_EXIST'} status_enum
 */

export const STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  DOES_NOT_EXIST: 'DOES_NOT_EXIST'
}

/**
 *
 * @param {String} streamer
 * @returns {Promise<{thumbnail: string, title: string, status: status_enum }>}
 */
export async function getStreamerStatus (streamer) {
  const data = await fetch('https://gql.twitch.tv/gql', {
    headers: {
      'client-id': 'kimne78kx3ncx6brgo4mv6wki5h1ko'
    },
    referrer: 'https://www.twitch.tv/',
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: `[{"operationName":"StreamMetadata","variables":{"channelLogin":"${streamer}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"1c719a40e481453e5c48d9bb585d971b8b372f8ebb105b17076722264dfa5b3e"}}}]`,
    method: 'POST',
    mode: 'cors',
    credentials: 'omit'
  }).then(res => res.json()).then(res => res[0].data)

  if (data.user === null) {
    return {
      thumbnail: 'https://static-cdn.jtvnw.net/ttv-static/404_preview-1280x720.jpg',
      title: STATUS.DOES_NOT_EXIST,
      status: STATUS.DOES_NOT_EXIST
    }
  }

  const isLive = data.user.stream !== null

  return {
    thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${streamer}-1280x720.jpg`,
    title: data.user.lastBroadcast.title,
    status: isLive ? STATUS.ONLINE : STATUS.OFFLINE
  }
}

export async function downloadStream (streamer, location) {
  fs.mkdir(location, { recursive: true }, (err) => { if (err) console.log(err) })
  const raw = spawn('cmd.exe', [
    '/c',
    path.normalize(path.join(binFolderLocation, '/streamlink/streamlink.bat')),
    '-o',
    path.normalize(`${location}/${streamer} ${getTimestamp()}.mp4`),
    'https://twitch.tv/' + streamer,
    'best'
  ])
  raw.stdout.on('data', (data) => console.debug(data.toString()))
  raw.stderr.on('data', (data) => console.error(data.toString()))
  return {
    process: raw,
    promise: new Promise(resolve => {
      raw.on('close', () => {
        resolve()
      })
    })
  }
}

function getTimestamp () {
  const d = new Date()
  return `${d.getFullYear()}-${formatNum(d.getMonth() + 1)}-${formatNum(d.getDate())} ${formatNum(d.getHours())}_${formatNum(d.getMinutes())}_${formatNum(d.getSeconds())}`
}

function formatNum (num) {
  return String(num).padStart(2, 0)
}

window.terminate = require('terminate')
