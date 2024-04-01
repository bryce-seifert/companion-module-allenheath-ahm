import { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import UpgradeScripts from './upgrades.js'

class AHMInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

		this.MIDI_PORT = 51325
		this.inputCount = this.config.model ?? 64
		this.zoneCount = this.config.model ?? 64
		this.colors = [
			{ id: 0, label: 'Off' },
			{ id: 1, label: 'Red' },
			{ id: 2, label: 'Green' },
			{ id: 3, label: 'Yellow' },
			{ id: 4, label: 'Blue' },
			{ id: 5, label: 'Magenta' },
			{ id: 6, label: 'Cyan' },
			{ id: 7, label: 'White' },
		]
		this.inputsMute = this.createArray(this.inputCount)
		this.inputsToZonesMute = {}
		this.zonesMute = this.createArray(this.zoneCount)
		this.inputOptions = []
		this.zoneOptions = []
		this.initTCP()
		this.initActions()
		this.initFeedbacks()
		this.initPresets()
		this.initVariables()
	}

	async destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.initActions()
		this.initTCP()
	}

	getConfigFields() {
		return [
			{
				type: 'dropdown',
				id: 'model',
				label: 'Device Model',
				default: 64,
				choices: [
					{ id: 16, label: 'AHM-16' },
					{ id: 32, label: 'AHM-32' },
					{ id: 64, label: 'AHM-64' },
				],
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 6,
				default: '',
				regex: Regex.IP,
			},
		]
	}

	initVariables() {
		const variables = getVariables.bind(this)()
		this.setVariableDefinitions(variables)
	}

	initFeedbacks() {
		const feedbacks = getFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	initPresets() {
		const presets = getPresets.bind(this)()
		this.setPresetDefinitions(presets)
	}

	initActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async getMuteInfoFromDevice(length) {
		for (let index = 0; index < length; index++) {
			this.getMuteInfo(0, index) // inputs
			await this.sleep(50)
			this.getMuteInfo(1, index) // zones
			await this.sleep(50)
		}
		// this.getMuteInfo(channel, 11)
	}

	getSourceSelectorChoices() {
		let buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x01, 0x01, 0x0f, 0x08, 51, 0xf7])]

		this.sendCommand(buffers)
	}

	async getZoneInfo(count) {
		for (let index = -1; index < count; index++) {
			let buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x01, 0x09, index, 0xf7])]
			this.sendCommand(buffers)
			await this.sleep(100)
		}
		this.initActions()
		this.initFeedbacks()
	}

	async getInputInfo(count) {
		for (let index = -1; index < count; index++) {
			let buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x09, index, 0xf7])]
			this.sendCommand(buffers)
			await this.sleep(150)
		}
		this.initActions()
		this.initFeedbacks()
	}

	getMuteInfo(channel, number) {
		let cmd = { buffers: [] }
		cmd.buffers = [
			Buffer.from([
				0xf0,
				0x00,
				0x00,
				0x1a,
				0x50,
				0x12,
				0x01,
				0x00,
				parseInt(channel),
				0x01,
				0x09,
				parseInt(number),
				0xf7,
			]),
		]
		for (let i = 0; i < cmd.buffers.length; i++) {
			if (this.midiSocket !== undefined) {
				this.midiSocket.send(cmd.buffers[i])
			}
		}
	}

	createArray(size, extraArrayLength) {
		let array = new Array(size)
		for (let index = 0; index < array.length; index++) {
			if (extraArrayLength) {
				array[index] = []
			} else {
				array[index] = 0
			}
		}
		return array
	}

	/* case 'get_phantom':
				cmd.buffers = [
					Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x0b, 0x1b, channel, 0xf7]),
				]
				break
			case 'get_muteInfo':
				cmd.buffers = [Buffer.from([0xf0, 0x00, 0x00, 0x1a, 0x50, 0x12, 0x01, 0x00, 0x00, 0x01, 0x09, channel, 0xf7])]
				break */

	sendCommand(buffers) {
		if (buffers.length != 0) {
			for (let i = 0; i < buffers.length; i++) {
				if (this.midiSocket !== undefined) {
					this.log('debug', `sending ${buffers[i].toString('hex')} via MIDI TCP @${this.config.host}`)
					try {
						this.midiSocket.send(buffers[i])
					} catch (error) {
						this.log('error', 'Error sending command: ' + error.message)
					}
				}
			}
		}
	}

	initTCP() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
			delete this.midiSocket
		}

		if (this.config.host) {
			this.midiSocket = new TCPHelper(this.config.host, this.MIDI_PORT)

			this.midiSocket.on('status_change', (status, message) => {
				this.updateStatus(status)
			})

			this.midiSocket.on('error', (err) => {
				this.log('error', 'MIDI error: ' + err.message)
			})

			this.midiSocket.on('data', (data) => {
				this.processIncomingData(data)
			})

			this.midiSocket.on('connect', () => {
				this.log('debug', `MIDI Connected to ${this.config.host}`)
				this.updateStatus(InstanceStatus.Ok)
				this.getInitialStates()
			})
		}
	}

	hexToDec(hexString) {
		return parseInt(hexString)
	}

	getInitialStates() {
		let channelCount = this.config.model ?? 64

		this.getMuteInfoFromDevice(channelCount)
		this.getZoneInfo(channelCount)
		this.getInputInfo(channelCount)
		//this.getSourceSelectorChoices()
	}

	processIncomingData(data) {
		//console.log(data[0], data[1], data[2])
		/* data.forEach((element) => {
			console.log(element.toString(16))
		}) */
		switch (data[0]) {
			case 144:
				// input mute
				// data[2] 63 == unmute, 127 == mute
				//console.log(`Channel ${data[2] == 63 ? 'unmute' : 'mute'}: ${this.hexToDec(data[1]) + 1}`)
				// this.log('debug', `Channel ${parseInt(data[1], 16) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.inputsMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('inputMute')
				break
			case 145:
				// zone mute
				//console.log(`Zone ${data[2] == 63 ? 'unmute' : 'mute'}: ${this.hexToDec(data[1]) + 1}`)
				//this.log('debug', `Zone ${this.hexToDec(data[1]) + 1} ${data[2] == 63 ? 'unmute' : 'mute'}`)
				this.zonesMute[this.hexToDec(data[1])] = data[2] == 63 ? 0 : 1
				this.checkFeedbacks('zoneMute')
				break
			case 240:
				//console.log(data.toJSON())
				switch (data[8]) {
					case 0:
						switch (data[9]) {
							case 10:
								//Get Input Name
								let name = new Buffer.from([
									data[11],
									data[12],
									data[13],
									data[14],
									data[15],
									data[16],
									data[17],
									data[18],
								]).toString()
								name = name?.replace(/\x00/g, '')

								let input = this.hexToDec(data[10])
								this.inputOptions.push({ label: `${input + 1}: ${name}`, id: input })
								//console.log(this.zoneOptions)
								break
							case 3:
								let channel = this.hexToDec(data[10])
								let zoneNumber = this.hexToDec(data[12])

								if (this.inputsToZonesMute[channel]?.[zoneNumber]) {
									this.inputsToZonesMute[channel][zoneNumber] = data[13] == 63 ? 0 : 1
								} else {
									this.inputsToZonesMute[channel] = {}
									this.inputsToZonesMute[channel][zoneNumber] = data[13] == 63 ? 0 : 1
								}
								this.checkFeedbacks('inputToZoneMute')
								break
						}
						break
					case 1:
						switch (data[9]) {
							case 10:
								//Get Zone Name
								let name = new Buffer.from([
									data[11],
									data[12],
									data[13],
									data[14],
									data[15],
									data[16],
									data[17],
									data[18],
								]).toString()
								name = name?.replace(/\x00/g, '')

								let zone = this.hexToDec(data[10])
								this.zoneOptions.push({ label: `${zone + 1}: ${name}`, id: zone })
								//console.log(this.zoneOptions)
								break
							case 2:
								//console.log('level')
								break
						}
						break
					default:
						//console.log('Extra data coming in')
						break
				}
		}
	}
}

runEntrypoint(AHMInstance, UpgradeScripts)
