export function getVariables() {
	const variables = []

	if (this.inputOptions.length > 0) {
		for (let i = 0; i < this.inputOptions.length; i++) {
			variables.push({
				name: `Input ${i + 1} - Name`,
				variableId: `input_${i + 1}_name`,
			})
		}
	}

	if (this.zoneOptions.length > 0) {
		for (let i = 0; i < this.zoneOptions.length; i++) {
			variables.push({
				name: `Zone ${i + 1} - Name`,
				variableId: `zone_${i + 1}_name`,
			})
		}
	}

	return variables
}

export function updateVariables() {
	if (this.inputOptions.length > 0) {
		for (let i = 0; i < this.inputOptions.length; i++) {
			this.setVariableValues({ [`input_${i + 1}_name`]: this.inputOptions[i].label })
		}
	}
	if (this.zoneOptions.length > 0) {
		for (let i = 0; i < this.zoneOptions.length; i++) {
			this.setVariableValues({ [`zone_${i + 1}_name`]: this.zoneOptions[i].label })
		}
	}
}
