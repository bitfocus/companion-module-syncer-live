import { combineRgb } from '@companion-module/base'

export default async function (self) {
	const subscriptions = new Map()
	const activeFeedbacks = new Set()

	async function ensureSubscription(feedback, recordId) {
		const previous = subscriptions.get(feedback.id)
		if (previous?.recordId === recordId) return previous.ready

		const subscription = { recordId }
		subscription.ready = (async () => {
			if (previous) await (await previous.ready)()
			return self.pb.collection('groups').subscribe(recordId, ({ record }) => {
				self.log('debug', `Received ${JSON.stringify(record)}`)
				self.checkFeedbacksById(feedback.id)
			})
		})()
		subscriptions.set(feedback.id, subscription)

		try {
			return await subscription.ready
		} catch (error) {
			if (subscriptions.get(feedback.id) === subscription) subscriptions.delete(feedback.id)
			throw error
		}
	}

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
				if (activeFeedbacks.has(feedback.id)) await ensureSubscription(feedback, data.recordId)

				return data.show
			},
			subscribe: async (feedback, context) => {
				activeFeedbacks.add(feedback.id)
				const res = await fetch(`https://syncer.live/control?groupId=${feedback.options.groupId}`)
				const data = await res.json()

				self.log('debug', `Subscribing to ${data.recordId}, ${JSON.stringify(feedback)}`)

				if (activeFeedbacks.has(feedback.id)) await ensureSubscription(feedback, data.recordId)
			},
			unsubscribe: async (feedback, context) => {
				activeFeedbacks.delete(feedback.id)
				const subscription = subscriptions.get(feedback.id)
				if (subscription) {
					subscriptions.delete(feedback.id)
					await (await subscription.ready)()
				}
			},
		},
	})
}
