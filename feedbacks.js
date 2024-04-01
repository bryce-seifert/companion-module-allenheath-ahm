import { combineRgb } from '@companion-module/base'

export function getFeedbacks() {
	const feedbacks = {}

	const ColorWhite = combineRgb(255, 255, 255)
	const ColorRed = combineRgb(200, 0, 0)

	feedbacks['inputMute'] = {
		type: 'boolean',
		name: 'Change background when input on mute',
		description: 'When you mute the input change color',
		defaultStyle: {
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		options: [
			{
				type: 'textinput',
				label: 'Select input',
				id: 'input',
				default: 1,
			},
		],
		callback: (feedback) => {
			return this.inputsMute[parseInt(feedback.options.input) - 1] == 1
		},
	}

	feedbacks['zoneMute'] = {
		type: 'boolean',
		name: 'Change background when zone on mute',
		description: 'When you mute the zone change color',
		defaultStyle: {
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Zone',
				id: 'zone',
				choices: this.zoneOptions,
				default: 0,
			},
		],
		callback: (feedback) => {
			return this.zonesMute[parseInt(feedback.options.zone) - 1] == 1
		},
	}

	feedbacks['inputToZoneMute'] = {
		type: 'boolean',
		name: 'Change background when input to zone on mute',
		description: 'When you mute the input on a zone change color',
		defaultStyle: {
			color: ColorWhite,
			bgcolor: ColorRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Input',
				id: 'input',
				choices: this.inputOptions,
				default: 0,
			},
			{
				type: 'dropdown',
				label: 'Zone',
				id: 'zone',
				choices: this.zoneOptions,
				default: 0,
			},
		],
		callback: (feedback) => {
			console.log(this.inputsToZonesMute[parseInt(feedback.options.input)])
			return this.inputsToZonesMute[parseInt(feedback.options.input)]?.[parseInt(feedback.options.zone)] == 1
		},
	}

	return feedbacks
}
