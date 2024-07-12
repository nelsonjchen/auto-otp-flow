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


export interface JsonEmail {
	processedDateTime: string;
	to: string;
	from: string;
	raw: string;
	headers: Record<string, string>;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		// See if the path has "/r/", parse the next part as the email address to retrieve emails for
		if (url.pathname.startsWith('/r/')) {
			const emails = await env.AUTO_OTP_FLOW_KV.list<string>({
				prefix: 'email:' + url.pathname.slice(3),
			});
			if (emails.keys.length === 0) {
				return new Response(JSON.stringify({
					error: 'No emails found',
				}), {
					headers: {
						'Content-Type': 'application/json',
					},
					status: 404
				});
			}
			// Get all the emails and join them into a single array
			const emailDataPromise = Promise.all(
				emails.keys.map(async (key) => {
					const email = await env.AUTO_OTP_FLOW_KV.get<JsonEmail>(
						key.name,
						{
							type: 'json',
						}
					) as JsonEmail;
					return email ? [email] : [];
				})
			);

			const emailData = (await emailDataPromise).flat();

			return new Response(JSON.stringify({
				emails: emailData,
			}), {
				headers: {
					'Content-Type': 'application/json',
				},
			});

		}
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
			msg: 'Worker received email',
			data: {
				value
			},
		});

		// Store the email in the KV namespace
		await env.AUTO_OTP_FLOW_KV.put(
			'email:' + message.to,
			JSON.stringify(value),
			// Expire the email after 30 minutes
			{ expirationTtl: 30 * 60 }
		);
	}
} satisfies ExportedHandler<Env>;
