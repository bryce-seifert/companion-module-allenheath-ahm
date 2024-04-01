import { CreateConvertToBooleanFeedbackUpgradeScript } from '@companion-module/base'

export default [
	CreateConvertToBooleanFeedbackUpgradeScript({
		inputMute: true,
		zoneMute: true,
		inputToZoneMute: true,
	}),
	function (context, props) {
		//v2.1.0
		let changed = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
		if (props.config !== null) {
			let config = props.config
			if (config.model == undefined || config.model == '') {
				config.model = 64
				changed.updatedConfig = config
			}
		}
		props.feedbacks.forEach((feedback) => {
			if (feedback.feedbackId === 'inputToZoneMute') {
				feedback.options.input = feedback.options.input ? feedback.options.input - 1 : 0
				feedback.options.zone = feedback.options.zone ? feedback.options.zone - 1 : 0
				changed.updatedFeedbacks.push(feedback)
			}
		})
		return changed
	},
]
