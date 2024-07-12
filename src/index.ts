/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return new Response('Hello World!');
	},
	async email(message, env, ctx) {
		const reader = message.raw.getReader();
		const chunks = [];
		let done = false;
		while (!done) {
			const { value, done: rDone } = await reader.read();
			if (value) {
				chunks.push(value);
			}
			done = rDone;
		}
		const body = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
		let offset = 0;
		for (const chunk of chunks) {
			body.set(chunk, offset);
			offset += chunk.length;
		}
		const bodyText = new TextDecoder().decode(body);

		const headersObj: Record<string, string> = {};
		message.headers.forEach((value, key) => {
			headersObj[key] = value;
		});

		const value = {
			processedDateTime: new Date().toISOString(),
			to: message.to,
			from: message.from,
			raw: bodyText,
			headers: headersObj,
		};

		// Log the email
		console.log({
			message: 'Received email',
			data: {
				value
			},
		});

		// Store the email in the KV namespace
		await env.AUTO_OTP_FLOW_KV.put(
			'email:' + message.to,
			JSON.stringify(value)
		);
	}
} satisfies ExportedHandler<Env>;
