import { combineRgb } from '@companion-module/base'

export default async function (self) {
	self.setFeedbackDefinitions({
		syncer_state: {
			name: 'Syncer State',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'groupId',
					type: 'textinput',
					label: 'Remote Group ID',
					required: true,
				},
			],
			callback: async (feedback) => {
				const res = await fetch(`https://syncer.live/control?groupId=${feedback.options.groupId}`)
				const data = await res.json()
				self.log('debug', `Received ${JSON.stringify(data)}`)

				return data.show
			},
			subscribe: async (feedback, context) => {
				const res = await fetch(`https://syncer.live/control?groupId=${feedback.options.groupId}`)
				const data = await res.json()

				self.log('debug', `Subscribing to ${data.recordId}, ${JSON.stringify(feedback)}`)

				await self.pb.collection('groups').subscribe(data.recordId, ({ record }) => {
					self.log('debug', `Received ${JSON.stringify(record)}`)
					self.checkFeedbacksById(feedback.id)
				})
			},
			unsubscribe: async (feedback, context) => {
				const res = await fetch(`https://syncer.live/control?groupId=${feedback.options.groupId}`)
				const data = await res.json()

				await self.pb.collection('groups').unsubscribe(data.recordId)
			},
		},
	})
}
