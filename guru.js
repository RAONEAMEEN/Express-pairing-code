console.log('✅Server Started...')

import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import { createInterface } from 'readline'
import yargs from 'yargs'
import { uploadFile, downloadFile } from './megaStorage.js' // Import Mega functions

const __dirname = dirname(fileURLToPath(import.meta.url))
const { say } = cfonts
const rl = createInterface(process.stdin, process.stdout)

say('Negga', {
  font: 'pallet',
  align: 'center',
  gradient: ['red', 'magenta'],
})
say(`pair`, {
  font: 'console',
  align: 'center',
  gradient: ['cyan', 'magenta'],
})

var isRunning = false
/**
 * Start a js file
 * @param {String} file 
 */
function start(file) {
  if (isRunning) return
  isRunning = true
  let args = [join(__dirname, file), ...process.argv.slice(2)]
  say([process.argv[0], ...args].join(' '), {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
  })
  setupMaster({
    exec: args[0],
    args: args.slice(1),
  })
  let p = fork()
  p.on('message', data => {
    console.log('[RECEIVED]', data)
    switch (data) {
      case 'reset':
        p.process.kill()
        isRunning = false
        start.apply(this, arguments)
        break
      case 'uptime':
        p.send(process.uptime())
        break
      case 'upload':
        // Trigger file upload to Mega
        uploadFile('path/to/local/file.txt', 'file.txt');
        break
      case 'download':
        // Trigger file download from Mega
        downloadFile('file.txt', 'path/to/local/file.txt');
        break
    }
  })
  
  p.on('exit', (_, code) => {
    isRunning = false
    console.error('❎An Error occured:', code)
    if (code === 0) return
    watchFile(args[0], () => {
      unwatchFile(args[0])
      start(file)
    })
  })
 
  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  if (!opts['test'])
    if (!rl.listenerCount())
      rl.on('line', line => {
        p.emit('message', line.trim())
      })
}

start('index.js')
