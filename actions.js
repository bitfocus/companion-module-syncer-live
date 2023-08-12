export default function (self) {
	self.setActionDefinitions({
		set_syncer: {
			name: 'Set Syncer State',
			options: [
				{
					id: 'groupId',
					type: 'textinput',
					label: 'Remote Group ID',
					required: true,
					regex: '^[a-z0-9-]+$',
				},
				{
					id: 'show',
					type: 'dropdown',
					label: 'Show',
					default: 'true',
					choices: [
						{ id: 'true', label: 'True' },
						{ id: 'false', label: 'False' },
						{ id: 'toggle', label: 'Toggle' },
					],
					required: true,
				},
			],
			callback: async (event) => {
				const res = await fetch(`https://syncer.live/control?groupId=${event.options.groupId}`, {
					method: 'POST',
					body: JSON.stringify({
						show: event.options.show,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				})
				const data = await res.json()
				self.log('debug', `Received ${JSON.stringify(data)}`)
			},
		},
	})
}
